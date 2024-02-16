import { writeFile } from "fs";
import fetch from "node-fetch";
import { uid } from "uid/secure";

export const saveNetworkImage = async (url) => {
  const networkImage = await fetch(url).catch(function (err) {
    
  });
  if (networkImage.status === 200) {
    const extension = networkImage.headers.get("content-type").split("/").pop();
    const profilePic = await networkImage.arrayBuffer().then((buffer) => Buffer.from(buffer));

    const image = `${uid(16)}.${extension}`.replace("./", "/");
    await writeFile("." + image, profilePic, (err) => {
      if (err) console.log(err);
    });
    return {
      hasError: false,
      image,
    };
  } else {
    
    return {
      hasError: true,
      message: "Error while fetching image",
    };
  }
};
