const updateUser = async (req, res,next) => {
    try {
  
  const user = req.user
  
  const data = Object.fromEntries(
    Object.entries(req.body).filter(([_, v]) => v != null && v !== "" && v !== "null")
  );
    
   
      const email = user.email
       console.log("Email ==>", email);
  
     
  
      const findUser = await authModel.findOne({ email});
      
  
      if (findUser) {
        if (req.files.profile) {
          // Process 'file' upload if it exists in the request
          const file = req.files.profile[0];
    
          const FileUploadModel = await fileUploadModel.create({
            file: file.filename,
            fileType: file.mimetype,
            user: findUser._id,
          });
  
         
    
          // Assuming you want to associate the uploaded file with the user
          await authModel.findByIdAndUpdate(findUser._id, {image:FileUploadModel._id});
        
        }
        // CHAPERONE MODEL
    if(findUser.userType == "chaperone"){
    
      const findUserType = await chaperoneModel.findOne({ user:findUser._id});
  
      const Chaperone = await chaperoneModel.findByIdAndUpdate(findUserType._id, {data},{ new: true });
      
      if (req.files.idCard) {
        // Process 'file' upload if it exists in the request
        const file = req.files.idCard[0];
  
        const FileUploadModel = await fileUploadModel.create({
          file: file.filename,
          fileType: file.mimetype,
          user: Chaperone._id,
        });
  
  
      // Assuming you want to associate the uploaded file with the user
      Chaperone.idCard = FileUploadModel._id;
      await Chaperone.save();
    }
    
      
      if (req.files.drivingLicense) {
        // Process 'file' upload if it exists in the request
        const file =req.files.drivingLicense[0];
    
        const FileUploadModel = await fileUploadModel.create({
          file: file.filename,
          fileType: file.mimetype,
          user: Chaperone._id,
        });
    
        // Assuming you want to associate the uploaded file with the user
        Chaperone.drivingLicense = FileUploadModel._id;
        await Chaperone.save();
      }
    
    
    }
    if(findUser.userType == 'user'){
      const findUserType = await userModel.findOne({ user:findUser._id});
      const User = await userModel.findByIdAndUpdate(findUserType._id, {data},{ new: true });
      
        if (req.files.medicalCard) {
          // Process 'file' upload if it exists in the request
          const file = req.files.medicalCard[0];
      
          const FileUploadModel = await fileUploadModel.create({
            file: file.filename,
            fileType: file.mimetype,
            user: User._id,
          });
      
          // Assuming you want to associate the uploaded file with the user
          User.medicalCard = FileUploadModel._id;
          await User.save();
        }
      
    
    
    
    
    
    }
  
    const token = await tokenGen(
      { id: findUser._id, userType: findUser.userType },
      "auth",
      data.deviceToken
    );
    
    
   
  if(user.userType == "user"){
  
  
    const UserModel = (
      await userModel.aggregate([
        {
          ///$match: { email: email, status: "accepted" },
          $match: { user: new mongoose.Types.ObjectId(user._id.toString())}
        },
    
  
        {
          $lookup: {
            from: "auths",
            localField: "user",
            foreignField: "_id",
            as: "auth",
          },
        },
        {
          $unwind: {
            path: "$auth",
            preserveNullAndEmptyArrays: true,
          },
        },
  
        {
          $lookup: {
            from: "fileuploads",
            localField: "auth.image",
            foreignField: "_id",
            as: "image",
          },
        },
        {
          $unwind: {
            path: "$image",
            preserveNullAndEmptyArrays: true,
          },
        },
  
  
  
        
        {
          $project: {
            devices: 0,
            loggedOutDevices: 0,
            otp: 0,
            updatedAt: 0,
            createdAt: 0,
            __v: 0,
            isDeleted:0,
            "auth.image":0,
            "auth.password": 0,
            "image.updatedAt": 0,
            "image.createdAt": 0,
            "image.__v": 0,
            "image.user": 0,
            "image.fileType": 0,
            "image._id": 0,
          },
        },
        {
          $addFields: {
            "image": "$image.file"
          }
        },
        { $limit: 1 },
      ])
    )[0];
  
    return next(
      CustomSuccess.createSuccess(
        {...UserModel, token},
        "UserUpdated Successfull",
        200
      )
    );
  
  
   
  }
  else if(user.userType == "chaperone"){
  
  
    const UserModel = (
      await chaperoneModel.aggregate([
        {
          ///$match: { email: email, status: "accepted" },
          $match: { user: new mongoose.Types.ObjectId(user._id.toString())}
        },
        {
          $lookup: {
            from: "auths",
            localField: "user",
            foreignField: "_id",
            as: "auth",
          },
        },
        {
          $unwind: {
            path: "$auth",
            preserveNullAndEmptyArrays: true,
          },
        },
  
        {
          $lookup: {
            from: "fileuploads",
            localField: "auth.image",
            foreignField: "_id",
            as: "image",
          },
        },
        {
          $unwind: {
            path: "$image",
            preserveNullAndEmptyArrays: true,
          },
        },
  
  
  
        
        {
          $project: {
            devices: 0,
            loggedOutDevices: 0,
            otp: 0,
            updatedAt: 0,
            createdAt: 0,
            __v: 0,
            isDeleted:0,
            "auth.image":0,
            "auth.password": 0,
            "image.updatedAt": 0,
            "image.createdAt": 0,
            "image.__v": 0,
            "image.user": 0,
            "image.fileType": 0,
            "image._id": 0,
          },
        },
        {
          $addFields: {
            "image": "$image.file"
          }
        },
        { $limit: 1 },
      ])
    )[0];
  
    return next(
      CustomSuccess.createSuccess(
       { UserModel, token},
        "User Updated Successfull",
        200
      )
    );
  
  
   
  }
  
      }
  
      const Auth = new authModel({
        fullName,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        password,
        userType
      });
  
      await Auth.save();
  
      if (req.files.profile) {
        // Process 'file' upload if it exists in the request
        const file = req.files.profile[0];
  
        const FileUploadModel = await fileUploadModel.create({
          file: file.filename,
          fileType: file.mimetype,
          user: Auth._id,
        });
  
       
  
        // Assuming you want to associate the uploaded file with the user
        await authModel.findByIdAndUpdate(Auth._id, {image:FileUploadModel._id});
      
      }
  
  
  
      console.log("THIS IS NEW AUTH ID",Auth._id)
      // CHAPERONE MODEL
  
  if(userType == "chaperone"){
    console.log("USER TYPE == chaperone")
  const Chaperone = new chaperoneModel({
    vehicleNo,
    vehicleName,
    experience,
    licenceNumber,
    licenceExpiry,
    hourlyFare,
    user:Auth._id
  
  })
  await Chaperone.save();
  
    if (req.files.idCard) {
      // Process 'file' upload if it exists in the request
      const file = req.files.idCard[0];
  
      const FileUploadModel = await fileUploadModel.create({
        file: file.filename,
        fileType: file.mimetype,
        user: Chaperone._id,
      });
  
      // Assuming you want to associate the uploaded file with the user
      Chaperone.idCard = FileUploadModel._id;
      await Chaperone.save();
    }
  
    
    if (req.files.drivingLicense) {
      // Process 'file' upload if it exists in the request
      const file = req.files.drivingLicense[0];
  
      const FileUploadModel = await fileUploadModel.create({
        file: file.filename,
        fileType: file.mimetype,
        user: Chaperone._id,
      });
  
      // Assuming you want to associate the uploaded file with the user
      Chaperone.drivingLicense = FileUploadModel._id;
      await Chaperone.save();
    }
  
  
  }
  
  if(userType == 'user'){
  
  console.log("USER TYPE == USER")
    const User = new userModel({
      medication,
      medicalCondition,
      allergies,
      emergencyNumber,
      pharmacyName,
      user:Auth._id
    
    })
    await User.save();
    
      if (req.files.medicalCard) {
        // Process 'file' upload if it exists in the request
        const file = req.files.medicalCard[0];
    
        const FileUploadModel = await fileUploadModel.create({
          file: file.filename,
          fileType: file.mimetype,
          user: User._id,
        });
    
        // Assuming you want to associate the uploaded file with the user
        User.medicalCard = FileUploadModel._id;
        await User.save();
      }
    
  
  
  
  
  
  }
  
  const token = await tokenGen(
    { id: Auth._id, userType: Auth.userType },
    "auth",
    data.deviceToken
  );
  
  
    
  
  if(Auth.userType == "user"){
  
  
    const UserModel = (
      await userModel.aggregate([
        {
          ///$match: { email: email, status: "accepted" },
          $match: { user: new mongoose.Types.ObjectId(Auth._id.toString())}
        },
    
  
        {
          $lookup: {
            from: "auths",
            localField: "user",
            foreignField: "_id",
            as: "auth",
          },
        },
        {
          $unwind: {
            path: "$auth",
            preserveNullAndEmptyArrays: true,
          },
        },
  
        {
          $lookup: {
            from: "fileuploads",
            localField: "auth.image",
            foreignField: "_id",
            as: "image",
          },
        },
        {
          $unwind: {
            path: "$image",
            preserveNullAndEmptyArrays: true,
          },
        },
  
  
  
        
        {
          $project: {
            devices: 0,
            loggedOutDevices: 0,
            otp: 0,
            updatedAt: 0,
            createdAt: 0,
            __v: 0,
            isDeleted:0,
            "auth.image":0,
            "auth.password": 0,
            "image.updatedAt": 0,
            "image.createdAt": 0,
            "image.__v": 0,
            "image.user": 0,
            "image.fileType": 0,
            "image._id": 0,
          },
        },
        {
          $addFields: {
            "image": "$image.file"
          }
        },
        { $limit: 1 },
      ])
    )[0];
  
    return next(
      CustomSuccess.createSuccess(
        {...UserModel,token},
        "User updated Successfully",
        200
      )
    );
  
  
   
  }
  else if(Auth.userType == "chaperone"){
  
  
    const UserModel = (
      await chaperoneModel.aggregate([
        {
          ///$match: { email: email, status: "accepted" },
          $match: { user: new mongoose.Types.ObjectId(Auth._id.toString())}
        },
        {
          $lookup: {
            from: "auths",
            localField: "user",
            foreignField: "_id",
            as: "auth",
          },
        },
        {
          $unwind: {
            path: "$auth",
            preserveNullAndEmptyArrays: true,
          },
        },
  
        {
          $lookup: {
            from: "fileuploads",
            localField: "auth.image",
            foreignField: "_id",
            as: "image",
          },
        },
        {
          $unwind: {
            path: "$image",
            preserveNullAndEmptyArrays: true,
          },
        },
  
  
  
        
        {
          $project: {
            devices: 0,
            loggedOutDevices: 0,
            otp: 0,
            updatedAt: 0,
            createdAt: 0,
            __v: 0,
            isDeleted:0,
            "auth.image":0,
            "auth.password": 0,
            "image.updatedAt": 0,
            "image.createdAt": 0,
            "image.__v": 0,
            "image.user": 0,
            "image.fileType": 0,
            "image._id": 0,
          },
        },
        {
          $addFields: {
            "image": "$image.file"
          }
        },
        { $limit: 1 },
      ])
    )[0];
  
    return next(
      CustomSuccess.createSuccess(
        {...UserModel,token},
        "User Updated Successfully",
        200
      )
    );
  
  
   
  }
  
     
    } catch (error) {
      console.error(error);
      console.log(error);
      return res.status(400).json({ status: 0, message: error.message });
    }
  };
  