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
//
// @require        https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js
//
// @version        0.2.1
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

    /**
     * The mapping between base- and foil tags.
     * @type {Object}
     */
    var tagMap = {
      "ubuntu-12.10"  : "ubuntu",
      "ubuntu-12.04"  : "ubuntu",
      "ubuntu-11.10"  : "ubuntu",
      "ubuntu-11.04"  : "ubuntu",
      "ubuntu-10.10"  : "ubuntu",
      "ubuntu-10.04"  : "ubuntu",
      "ubuntu-9.10"   : "ubuntu",
      "ubuntu-9.04"   : "ubuntu",
      "ubuntu-8.10"   : "ubuntu",
      "ubuntu-8.04"   : "ubuntu",
      "kubuntu"       : "ubuntu",
      "lubuntu"       : "ubuntu",
      "xubuntu"       : "ubuntu",
      "ubuntu-server" : "ubuntu",
      "ubuntu-unity"  : "ubuntu",

      "centos" : "linux",
      "debian" : "linux",
      "rhel"   : "linux",
      "ubuntu" : "linux",

      "windows-8"     : "windows",
      "windows-7"     : "windows",
      "windows-vista" : "windows",
      "windows-xp"    : "windows",

      "osx-snow-leopard" : "osx",

      "safari"            : "browser",
      "firefox"           : "browser",
      "internet-explorer" : "browser",
      "google-chrome"     : "browser",

      "wireless-networking" : "networking",

      "microsoft-excel"      : "microsoft-office",
      "microsoft-onenote"    : "microsoft-office",
      "microsoft-outlook"    : "microsoft-office",
      "microsoft-powerpoint" : "microsoft-office",
      "microsoft-word"       : "microsoft-office",

      "microsoft-excel-2002" : "microsoft-excel",
      "microsoft-excel-2003" : "microsoft-excel",
      "microsoft-excel-2007" : "microsoft-excel",
      "microsoft-excel-2008" : "microsoft-excel",
      "microsoft-excel-2010" : "microsoft-excel",
      "microsoft-excel-2011" : "microsoft-excel",
      "microsoft-excel-2013" : "microsoft-excel",

      "microsoft-onenote-2007" : "microsoft-onenote",
      "microsoft-onenote-2010" : "microsoft-onenote",

      "microsoft-outlook-2002" : "microsoft-outlook",
      "microsoft-outlook-2003" : "microsoft-outlook",
      "microsoft-outlook-2007" : "microsoft-outlook",
      "microsoft-outlook-2010" : "microsoft-outlook",
      "microsoft-outlook-2011" : "microsoft-outlook",
      "microsoft-outlook-2013" : "microsoft-outlook",

      "microsoft-powerpoint-2003" : "microsoft-powerpoint",
      "microsoft-powerpoint-2007" : "microsoft-powerpoint",
      "microsoft-powerpoint-2010" : "microsoft-powerpoint",
      "microsoft-powerpoint-2011" : "microsoft-powerpoint",

      "microsoft-word-2003" : "microsoft-word",
      "microsoft-word-2007" : "microsoft-word",
      "microsoft-word-2008" : "microsoft-word",
      "microsoft-word-2010" : "microsoft-word"
    };

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
        var sourceTags = reverseTagMap[ tag ].join( " or " );
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

    console.log( "Foiling started.");

    // Retrieve the users favorite and ignored tags.
    interestingTags = $( "#interestingTags a" ).map( function( index, tag ) {
      return this.text;
    } ).get();
    ignoredTags = $( "#ignoredTags a" ).map( function( index, tag ) {
      return this.text;
    } ).get();

    // Expand the tags on all visible questions.
    applyFoilToAll();

    console.log( "Preparing foil for future guests..." );

    $( document ).on( "click", ".new-post-activity", function() {
      setTimeout( applyFoilToAll, 1000 );
    } );

    console.log( "Foiling ended." );
  });
}

// load jQuery and execute the main function
addJQuery( main );