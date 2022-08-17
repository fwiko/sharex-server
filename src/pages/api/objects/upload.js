import { prisma } from '@lib/prisma';
import { generateObjectId, getObjectUrl } from '@helpers/aws';
import { compareHash } from '@helpers/auth';
import formidable from 'formidable';
import path from 'path';

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('method not allowed.');
        return;
    }

    // Authorise request
    const { username, password } = req.headers;
    const userRecord = await prisma.user.findUnique({ where: { username } });
    if (!userRecord || !compareHash(password, userRecord.password)) {
        res.status(401).send('unauthorised.');
        return;
    }

    // Validate request body
    const maxFileSize = process.env.MAXIMUM_FILE_SIZE_MB * 1024 * 1024;
    const reqForm = new formidable.IncomingForm({
        maxFiles: 1,
        keepExtensions: true,
        allowEmptyFiles: false,
        maxFileSize: maxFileSize,
        multiples: false
    });

    // Parse uploaded file
    let uploadObject;
    try {
        uploadObject = await new Promise((resolve, reject) => {
            reqForm.parse(req, (err, fields, files) => {
                if (err) {
                    reject(new Error('upload request exceeds constraints.'));
                    return;
                } else if (!files.upload) {
                    reject(new Error('no file attached under "upload" field.'));
                    return;
                }
                resolve(files.upload);
            });
        });
    } catch (err) {
        res.status(400).send(err.message);
        return;
    }

    const { filepath, mimetype, size } = uploadObject;
    const objectId = await generateObjectId(12);
    const objectName = `${objectId}${path.extname(filepath)}`;

    // Insert object record into database
    try {
        await prisma.object.create({
            data: {
                id: objectId,
                name: objectName,
                type: mimetype,
                size: size,
                ownerId: userRecord.id
            }
        });
    } catch (err) {
        res.status(500).send('failed to add file record. file upload cancelled.');
        return;
    }

    // Upload file to S3
    try {
        // await uploadObject({
        //     objectName,
        //     filePath: filepath,
        //     fileType: mimetype
        // })
        await new Promise((resolve, reject) => resolve());
    } catch (err) {
        console.error(err.stack);
        res.status(500).send('failed to upload file.');
        await prisma.object.delete({ where: { id: objectId } });
        return;
    }

    res.status(200).send(getObjectUrl(objectName));
}

export default handler;

export const config = {
    api: {
        bodyParser: false,
    }
}