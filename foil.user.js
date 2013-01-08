// ==UserScript==
//
// @name           Foil
// @description    Does weird stuff on StackExchange sites
// @homepage       http://github.com/oliversalzburg/foil/
// @namespace      http://oliversalzburg.github.com/
// @author         Oliver Salzburg, oliversalzburg (http://github.com/oliversalzburg/)
// @license        MIT License (http://opensource.org/licenses/mit-license.php)
//
// @include        http://superuser.com/*
// @include        http://stackoverflow.com/*
// @include        http://serverfault.com/*
//
// @require        https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js
//
// @version        0.3
//
// ==/UserScript==

// jQuery loading from http://erikvold.com/blog/index.cfm/2010/6/14/using-jquery-with-a-user-script
function addJQuery( callback, jqVersion ) {
  jqVersion       = jqVersion || "1.8.3";
  var D           = document;
  var target      = D.getElementsByTagName( "head" )[ 0 ] || D.body || D.documentElement;
  var scriptNode  = D.createElement( "script" );
  scriptNode.src  = "//ajax.googleapis.com/ajax/libs/jquery/" + jqVersion + "/jquery.min.js";
  scriptNode.addEventListener( "load", function () {
    var scriptNode          = D.createElement("script");
    scriptNode.textContent  = "var gm_jQuery  = jQuery.noConflict(true);\n" +
                              "(" + callback.toString () + ")(gm_jQuery);";
    target.appendChild( scriptNode );
  }, false );
  target.appendChild( scriptNode );
}

/**
 * Main entry point
 * @param $ A reference to jQuery
 */
function main( $ ) {
  $( function() {

    // Get the first token of the hostname as our current site.
    // For philosophy.stackexchange.com, that results in philosophy.
    // For superuser.com, it results in superuser
    var foilTarget = document.location.hostname.split( '.' )[ 0 ].toLowerCase();
    // ...for meta.something.foo, we adjust a little
    if( "meta" == foilTarget ) foilTarget = document.location.hostname.split( '.' )[ 1 ].toLowerCase();


    /**
     * Our container to store foiling sets (even though it'll usually just contain one set).
     */
    var foil = [];

    // Try to load the foil set for our current target
    if( undefined === foil[ foilTarget ] ) {
      foil[ foilTarget ] = null;
      $.getJSON("http://query.yahooapis.com/v1/public/yql",
        {
          q:      "select * from json where url=\"https://raw.github.com/oliversalzburg/foil/master/foil/" + foilTarget + ".json\"",
          /*callback: gotJSON, // you don't even need this line if your browser supports CORS*/
          format: "json",
          jsonCompat: "new"
        },
        function( data ){
          if( data.query.results ) {
            tagMap = foil[ foilTarget ] = data.query.results.json;
            console.log( "FOIL: Received foil set '" + foilTarget + "' for current site." );

          } else {
            console.error( "FOIL: Failed to receive foil set '" + foilTarget + "'!" );
            loaderDelay = Number.MAX_VALUE;
          }
        }
      );
    }

    var tagMap = null;
    var reverseTagMap = [];

    /**
     * The favorite tags of the user.
     * @type {Array}
     */
    var interestingTags = [];

    /**
     * The ignored tags of the user.
     * @type {Array}
     */
    var ignoredTags = [];

    /**
     * Builds a reverse map for a tag.
     *
     * Assuming we want to build the reverse map for "windows", this would iterate over the whole tag map
     * and check which tags contain "windows" as the foil tag. Then it would build a list of all the matching tags.
     * @param seed The tag for which to build the reverse map.
     * @return {*}
     */
    function reverseTag( seed ) {
      if( reverseTagMap.hasOwnProperty( seed ) ) return reverseTagMap[ seed ];

      // No reverse map calculated yet, build it.
      reverseTagMap[ seed ] = [];
      expandTagMap( seed, seed );
    }

    /**
     * Recursively expands all foil tags to their underlying tags.
     * @param seed The foil tag in the reverse tag map that should be expanded.
     * @param search The tag to currently search for. Usually, you'll want to pass the same value as for seed.
     */
    function expandTagMap( seed, search ) {
      for( var tag in tagMap ) {
        if( tagMap[ tag ] == search ) {
          reverseTagMap[ seed ].push( tag );
          expandTagMap( seed, tag );
        }
      }
    }

    /**
     * Expands the tags on a given question.
     * @param question The question that should have its tags expanded.
     */
    function applyFoil( question ) {
      // Get existing tags from question
      var existingTags = $( "a[rel='tag']", question ).map( function( index, tag ) {
        return this.text;
      } ).get();

      // Add new tags as required
      var newTags = [];
      for( var tagCandidate in tagMap ) {
        // The foil tag that we possibly want to add to this question.
        var foilCandidate = tagMap[ tagCandidate ];

        // Is the tag candidate a tag on this question?
        if( $.inArray( tagCandidate, existingTags ) > -1 &&
            // ...and does the foil candidate not yet exist on the question?
            $.inArray( foilCandidate, existingTags ) == -1 &&
            // ...and is the foil candidate not already on the list of foil tags to be added?
            $.inArray( foilCandidate, newTags ) == -1 ) {

          // OK. Add this foil tag!
          newTags.push( foilCandidate );

          // Check if we have to build the reverse map for this tag.
          // The reverse map will allow us to easily determine which tags "make up" a given foil tag.
          reverseTag( foilCandidate );
        }
      }

      $( newTags ).each( function( index, tag ) {
        var sourceTags = reverseTagMap[ tag ].join( " or " ) + " or " + tag;
        var foilTag = $("<a>" ).html( tag ).attr(
          {
            "class" : "post-tag",
            "href"  : "/questions/tagged/" + sourceTags,
            "rel"   : "tag",
            "style" : "opacity:0.6",
            "title" : "Show all questions tagged " + sourceTags
          }
        );
        $( "a[rel='tag']", question ).last().after( foilTag );

        // If our foil tag is a favorite or ignored tag,
        // apply the corresponding class to the question.
        if( $.inArray( tag, interestingTags ) > -1 ) {
          $( question ).addClass( "tagged-interesting" );
        }
        if( $.inArray( tag, ignoredTags ) > -1 ) {
          $( question ).addClass( "tagged-ignored" );
        }

      } );

      // Recurse until no new tags are added
      if( newTags.length > 0 ) {
        applyFoil( question );
      }
    }

    /**
     * Expands tags on all currently loaded questions.
     */
    function applyFoilToAll() {
      $( ".question-summary" ).each( function( index, question ) {
        applyFoil( question );
      } );
    }

    var loaderDelay = 500;

    /**
     * Main processing
     */
    function weBeFoiling() {
      if( null === foil[ foilTarget ] ) {
        if( 10000 > loaderDelay ) {
          console.log( "FOIL: No foil yet. Retrying in " + loaderDelay + "ms..." );
          setTimeout( weBeFoiling, loaderDelay );
        }
        loaderDelay += 500;
        return;
      }

      console.log( "FOIL: Foiling started.");

      // Retrieve the users favorite and ignored tags.
      interestingTags = $( "#interestingTags a" ).map( function( index, tag ) {
        return this.text;
      } ).get();
      ignoredTags = $( "#ignoredTags a" ).map( function( index, tag ) {
        return this.text;
      } ).get();

      // Expand the tags on all visible questions.
      applyFoilToAll();

      console.log( "FOIL: Preparing foil for future guests..." );

      $( document ).on( "click", ".new-post-activity", function() {
        setTimeout( applyFoilToAll, 1000 );
      } );

      console.log( "FOIL: Foiling ended." );
    }

    // Let's go!
    weBeFoiling();

  });
}

// load jQuery and execute the main function
addJQuery( main );