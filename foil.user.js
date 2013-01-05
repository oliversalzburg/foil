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
// @version        0.1.5
// @history        0.1 Initial release
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

function main($) {
  $(function(){

    var tagMap = {
      "ubuntu" : "linux",

      "windows-xp" : "windows",
      "windows-7"  : "windows",
      "windows-8"  : "windows",

      "safari"        : "browser",
      "firefox"       : "browser",
      "google-chrome" : "browser"
    };

    var reverseMap = [];

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
      } );
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

    expandAllTags();

    console.log( "Preparing foil for future guests..." );

    $( document ).on( "click", ".new-post-activity", function() {
      console.log( "Clicked!" );
      setTimeout(expandAllTags,1000);
    } );

    console.log( "Foiling ended." );
  });
}

// load jQuery and execute the main function
addJQuery(main);