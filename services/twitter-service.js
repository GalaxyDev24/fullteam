"use strict";

/* jshint esversion: 6 */
var utf8 = require('utf8');

class TwitterService {
    static parse(tweet) {

        if (typeof tweet === 'undefined') {
	    	return;
	    }

	    if (typeof tweet === 'object' && tweet.hasOwnProperty('errors')) {
	    	message = '';
	    	var errors = tweet.errors;
	    	for (var i in errors) {
	    		message += errors[i].message + " (error code: " + errors[i].code + ").<br/>";
	    		message += " For more information, visit ";
	    		message += " <a href=\"https://dev.twitter.com/overview/api/response-codes\">Error Codes & Responses</a>.";
	    	}

	    	return message;
	    }

	 	// Tweet[] array
	    var Tweets = [];

    	// Take retweeted info if this is a retweet
    	var retweeter = null;
        if (tweet.retweeted_status) {
            // Get retweeter user name
            retweeter = tweet.user.name;
            
            // Replace tweet with retweeted status
            tweet = tweet.retweeted_status;
        }

        // Process tweet text
        var tweet_text = tweet.text;
        if (typeof tweet_text === 'undefined') {
            tweet_text = tweet.full_text;
        }
        if (tweet.entities.urls.length > 0) {
            tweet_text = expand_urls(tweet.entities.urls, tweet_text);
        }

        // Try remove the link at the end of the twitter post
        var ix = tweet_text.lastIndexOf('https://t.co');
        if (typeof ix !== 'undefined' && ix != null && ix > 0) {
          tweet_text = tweet_text.substring(0, ix-1);
        }

        tweet_text = utf8.encode(tweet_text); // Tweet text may contain special characters

        // Create a new Tweet object
        var tweet_obj = {
            "created_at"    : tweet.created_at, 
            "image_url"     : tweet.user.profile_image_url_https, 
            "screen_name"   : tweet.user.screen_name, 
            "user_name"     : tweet.user.name, 
            "tweet_text"    : tweet_text, 
            "id_str"        : tweet.id_str,
            "retweeter"     : retweeter,
            "retweet_count" : number_format(tweet.retweet_count),
            "favorite_count": number_format(tweet.favorite_count),
            "media"         : extract_media(tweet)
        };
        
        // Add it to the collection
        Tweets.push(tweet_obj);

	    return Tweets;
    }
}

var expand_urls = function(urls, text) {
    urls.forEach(function(item, index){
    	text = text.replace(item.url, item.expanded_url);
    });

    return text;
}

var number_format = function(number) {
    var k = number/1000;
    if (k >= 1) return (parseFloat(k.toFixed(1))) + 'K';
    return number;
}

var extract_media = function(tweet) {
    var media = [];

    // Images
    if (tweet.entities && typeof tweet.entities === 'object' && tweet.entities.media) {
    	var media_ = tweet.entities.media;
        media_.forEach(function(_media, index){
        	var aMedia = {
            	'id' : _media.id_str, // ID is used to check later if this is a thumbnail of a vine/video/gif and if so, remove it
                'type' : _media.type,
                'url' : _media.media_url_https,
                'media_url' : _media.url,
                'width' : _media.sizes.large.w,
                'height' : _media.sizes.large.h
            };

            media.push(aMedia);
        });
    }

    // Animated GIF
    if (tweet.extended_entities && typeof tweet.extended_entities === 'object' && tweet.extended_entities.media) {
        var media_ = tweet.extended_entities.media;
        media_.forEach(function(_media, index) {
            if (_media.type === 'animated_gif') {
                remove_medium(media, _media.id_str);
                var aMedia = {
	            	'type' : 'animated_gif',
                    'url' : _media.video_info.variants[0].url,
                    'width' : _media.sizes.large.w,
                    'height' : _media.sizes.large.h
	            };

	            media.push(aMedia);
            }
        });
    }

    // Vine & YouTube
    if (tweet.entities && typeof tweet.entities === 'object' && tweet.entities.urls) {
    	var media_ = tweet.entities.urls; 
        for (var k in media_) {
        	var url = media_[k];
            // Vine
            if (url.display_url.indexOf('vine.co') != -1) {
                media.push({
	            	'type' : 'vine',
                    'url' : url.expanded_url,
                    'embed_url' : url.expanded_url + '/embed/simple'
	           });
            }

            // YouTube
            if (url.display_url.indexOf('youtu.be') != -1) {
                media.push({
	            	'type' : 'youtube',
                    'url' : url.expanded_url,
                    'embed_url': 'https://www.youtube.com/embed/' + url.expanded_url.replace(/https?:\/\/youtu\.be\//, '')
	            });
            }
        }
    }

    return media.length == 0 ? null : media;
}

var remove_medium = function(media, id) {
	for (var k in media) {
		var medium = media[k];
		if (media[k].id === id) {
			media.splice(k, 1);
			break;
		}
	}
}

module.exports = TwitterService;
