import NotificationModel from "../DB/Model/notificationModal.js";
import CustomError from "../Utils/ResponseHandler/CustomError.js";
import CustomSuccess from "../Utils/ResponseHandler/CustomSuccess.js";


const fetchNotificationsByUserId = async (req, res, next) => {
    try {
      const { userId } = req.params;
  
      // Fetch notifications based on user ID
      const notifications = await NotificationModel.find({ user: userId });
  
      return res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (err) {
      return next(err);
    }
  };
  
  
  const createNotification = async (notificationData) => {
    try {
      const { type, title, description, link, user } = notificationData;
  
      // Create a new notification
      const notification = new NotificationModel({
        type,
        title,
        description,
        link,
        user,
      });
  
      // Save the notification to the database
      const createdNotification = await notification.save();
  
      return ({
        success: true,
        data: createdNotification,
      });
    } catch (err) {
      console.log(err);
    }
  };  
  
  
  
  const deleteNotificationsByUserId = async (req, res, next) => {
    try {
      const { userId } = req.params;
  
      // Delete notifications based on user ID
      const deletedNotifications = await NotificationModel.deleteMany({ user: userId });
  
      return res.status(200).json({
        success: true,
        data: {
          deletedCount: deletedNotifications.deletedCount,
        },
      });
    } catch (err) {
      return next(err);
    }
  };



const NotificationController = {
    createNotification,
    fetchNotificationsByUserId,
    deleteNotificationsByUserId
};

export default NotificationController;
