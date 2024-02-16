// var FCM = require("fcm-node");
import FCM from "fcm-node";
var serverKey =
"AAAADOC20uQ:APA91bHemCB2O0aXc6VM7b5LB_-ycQyiHmb5RHowIaozlBE6ypNZvvk6tvCXtyGo9TgolqKqy9bzGlcvqwO5nX9SHvIwKmqGeMDO14YhSydQGh5V2XlHxfjSpuRJozdEzPzltRfSdna4"; //put your server key here
var fcm = new FCM(serverKey);

const push_notifications = (notification_obj) => {
  console.log(notification_obj);
  var message = {
    to: notification_obj.deviceToken,
    collapse_key: "your_collapse_key",

    notification: {
      title: notification_obj.title,
      body: notification_obj.body,
      sound:"default"
    },
  };

  fcm.send(message, function (err, response) {
    
    if (err) {
      console.log("err", err);
    } else {
      console.log("response", response);
    }
  });
};

// module.exports = { push_notifications };
export default push_notifications;
