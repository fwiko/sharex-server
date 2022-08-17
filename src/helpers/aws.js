import fs from 'fs';
import aws from 'aws-sdk';

import { prisma } from "@lib/prisma";
import { getRandomString } from "./misc";

const s3Client = new aws.S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

export const getObjectUrl = (objectName) => {
    return `/${objectName}`
}

export const generateObjectId = async (length) => {
    const objectId = getRandomString(length);
    if (!await prisma.object.findUnique({ where: { id: objectId } })) {
        return objectId;
    } else {
        return generateObjectId(length);
    }
}

export const uploadObject = ({ objectName, filePath, fileType }) => {
    return new Promise((resolve, reject) => {
        s3Client.putObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: objectName,
            Body: fs.createReadStream(filePath),
            ContentType: fileType,
            ACL: 'public-read',
            CacheControl: 'max-age=21600'
        }, (err, res) => {
            if (err) reject(err);
            return resolve(res)
        })
    });
}