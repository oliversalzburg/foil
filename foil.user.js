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
// @version        0.1.3
// @history        0.1 Initial release
//
// ==/UserScript==

// jQuery loading from http://erikvold.com/blog/index.cfm/2010/6/14/using-jquery-with-a-user-script

// a function that loads jQuery and calls a callback function when jQuery has finished loading
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

    function expandTags( question ) {
      // Get existing tags from question
      var existingTags = $( "a[rel='tag']", question ).map( function( index, tag ) {
        return this.text;
      } ).get();

      console.log( "PRE : " + existingTags );

      // Add new tags as required
      var newTags = new Array();
      if( $.inArray( "ubuntu", existingTags ) > -1 && $.inArray( "linux", existingTags ) == -1 ) {
        newTags.push( "linux" );
      }
      if( $.inArray( "windows-7", existingTags ) > -1 && $.inArray( "windows", existingTags ) == -1 ) {
        newTags.push( "windows" );
      }

      console.log( "ADD : " + newTags );

      $( newTags ).each( function( index, tag ) {
        var uberTag = $("<a>" ).html( tag ).attr(
          {
            "class" : "post-tag",
            "rel"   : "tag",
            "style" : "color:#666"
          }
        );
        $( "a[rel='tag']", question ).last().after( uberTag );
      } );
    }

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