import client from "../../client";
import bcrypt from "bcrypt";
// import { createWriteStream } from 'fs';
import { protectedResolver } from "../users.utils";
import GraphQLUpload from 'graphql-upload';
import { uploadToS3 } from "../../shared/shared.utils";

export default {
    Upload: GraphQLUpload,
    Mutation: {
        editProfile: protectedResolver(async(_, {
            firstName,
            lastName,
            username,
            bio,
            email,
            avatar,
            password: newPassword,
        }, { loggedInUser }) => {
            let avatarUrl = null;
            if (avatar) {
                avatarUrl = await uploadToS3(avatar, loggedInUser.id, "avatars");

                // const { file: { filename, createReadStream } } = await avatar;
                // const newFilename = `${loggedInUser.id}-${Date.now()}-${filename}`;
                // const readStream = createReadStream();
                // const writeStream = createWriteStream(process.cwd() + "/uploads/" + newFilename);
                // readStream.pipe(writeStream);
                // avatarUrl = `http://localhost:4000/static/${newFilename}`
            }

            let uglyPassword = null;
            if (newPassword) uglyPassword = await bcrypt.hash(newPassword, 10);
            const updatedUser = await client.user.update({
                where: { id: loggedInUser.id },
                data: {
                    firstName,
                    lastName,
                    username,
                    email,
                    bio,
                    ...(avatarUrl && { avatar: avatarUrl }),
                    ...(uglyPassword && { password: uglyPassword })
                }
            });

            if (updatedUser.id) {
                return {
                    ok: true
                }
            } else {
                return {
                    ok: false,
                    error: "Edit profile incompleted"
                }
            }
        })
    }
}