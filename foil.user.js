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
// @version        0.2
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

      "ubuntu" : "linux",

      "windows-8"  : "windows",
      "windows-7"  : "windows",
      "windows-xp" : "windows",

      "safari"            : "browser",
      "firefox"           : "browser",
      "internet-explorer" : "browser",
      "google-chrome"     : "browser"
    };

    var reverseMap = [];

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
     * Expands the tags on a given question.
     * @param question The question that should have its tags expanded.
     */
    function expandTags( question ) {
      // Get existing tags from question
      var existingTags = $( "a[rel='tag']", question ).map( function( index, tag ) {
        return this.text;
      } ).get();

      // Add new tags as required
      var newTags = [];
      for( var tagCandidate in tagMap ) {
        if( $.inArray( tagCandidate, existingTags ) > -1 &&
            $.inArray( tagMap[ tagCandidate ], existingTags ) == -1 &&
            $.inArray( tagMap[ tagCandidate ], newTags ) == -1 ) {
          newTags.push( tagMap[ tagCandidate ] );

          // Check if we have to build the reverse map for this tag.
          // The reverse map will allow us to easily determine which tags "make up" a given foil tag.
          var seed = tagMap[ tagCandidate ];
          if( !reverseMap.hasOwnProperty( seed ) ) {
            // No reverse map calculated yet, build it.
            reverseMap[ seed ] = [];
            for( var tag in tagMap ) {
              if( tagMap[ tag ] == seed ) {
                reverseMap[ seed ].push( tag );
              }
            }
          }
        }
      }

      // Just some logging
      if( newTags.length > 0 ) {
        console.log( "PRE : " + existingTags );
        console.log( "ADD : " + newTags );
      }

      $( newTags ).each( function( index, tag ) {
        var sourceTags = reverseMap[ tag ].join( " or " );
        var foilTag = $("<a>" ).html( tag ).attr(
          {
            "class" : "post-tag",
            "href"  : "/questions/tagged/" + sourceTags,
            "rel"   : "tag",
            "style" : "color:#666",
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
        expandTags( question );
      }
    }

    /**
     * Expands tags on all currently loaded questions.
     */
    function expandAllTags() {
      $( ".question-summary" ).each( function( index, question ) {
        expandTags( question );
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
    expandAllTags();

    console.log( "Preparing foil for future guests..." );

    $( document ).on( "click", ".new-post-activity", function() {
      setTimeout( expandAllTags, 1000 );
    } );

    console.log( "Foiling ended." );
  });
}

// load jQuery and execute the main function
addJQuery( main );