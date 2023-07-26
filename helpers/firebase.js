var request = require('request-promise');
var knex = require('lib/knex');

function sendPushNotification(fcmid, data) {
    var pushmessage = {
        "to": fcmid,
        "priority": "high",
        "data": data,
    };

    var options = {
        method: 'POST',
        uri: 'https://fcm.googleapis.com/fcm/send',
        json: true, // Automatically stringifies the body to JSON
        body: pushmessage,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'key=AAAAarJLUSg:APA91bF2y7RAB1_xGrWBjPnQV82g5bqGWuUBmPlbEZKf2NCYP0rChNWO1W2JgXpmMzDHAfQQlDzycomC4Y7naGIGuOZzDM1V3oWfLXB4LLCLHekzzhp_XgHthOVm8t-YnRoz7HuUi-6B'
        },
    };

    return request(options);
}

/** Send a push notification to a given topic string. */
function pushToTopic(topic, data) {
    var pushmessage = {
        "to": '/topics/' + topic,
        "priority": "high",
        "data": data,
    };

    var options = {
        method: 'POST',
        uri: 'https://fcm.googleapis.com/fcm/send',
        json: true, // Automatically stringifies the body to JSON
        body: pushmessage,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'key=AAAAarJLUSg:APA91bF2y7RAB1_xGrWBjPnQV82g5bqGWuUBmPlbEZKf2NCYP0rChNWO1W2JgXpmMzDHAfQQlDzycomC4Y7naGIGuOZzDM1V3oWfLXB4LLCLHekzzhp_XgHthOVm8t-YnRoz7HuUi-6B'
        },
    };

    return request(options);
}

/** Subscribe a given fcm id list to a topic (string). 
 * # Params
 * * `fcmids` - A list of firebase cloud messaging IDs
 * * `topic` - A string - the name of the topic.
 * # Returns
 * A promise which completes when the request has been sent.
 */
function addFCMToTopic(fcmids, topic) {
    var msg = {
        "to": topic,
        "registration_tokens": fcmids,
    };

    var options = {
        method: 'POST',
        uri: 'https://iid.googleapis.com/iid/v1:batchAdd',
        json: true, 
        body: msg,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'key=AAAAarJLUSg:APA91bF2y7RAB1_xGrWBjPnQV82g5bqGWuUBmPlbEZKf2NCYP0rChNWO1W2JgXpmMzDHAfQQlDzycomC4Y7naGIGuOZzDM1V3oWfLXB4LLCLHekzzhp_XgHthOVm8t-YnRoz7HuUi-6B'
        },
    };

    return request(options);
}


module.exports = {
    sendPushNotification: sendPushNotification,
    pushToTopic: pushToTopic,
    addFCMToTopic: addFCMToTopic,
};
