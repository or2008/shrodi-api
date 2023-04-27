import { existsSync } from 'node:fs';

import { z } from 'zod';
import { ez } from 'express-zod-api';

import defaultEndpointsFactory from '../endpoints-factory.js';
import { authMiddleware } from '../middlewares/auth.js';
import { fileStreamingEndpointsFactory } from '../endpoints-factory/file-streaming.js';

// export const router = Router();

// const promptSchema = z.object({
//     body: z.object({
//         prompt: z.string({ required_error: "Prompt is required" }).max(500, "Must be 500 or fewer characters long")
//     }),
// });

// router.get('/', (req: Request, res: Response) => {
//     return res.json({ message: "Cool" });
// });

// router.post('/prompt', validate(promptSchema), (req: Request, res: Response) => {
//     const prompt = req.body.prompt;
//     // Your code here
//     return res.json({ message: "Validation with Zod 👊" });
// });

// router.post('/prompt-enhanced', validate(promptSchema), (req: Request, res: Response) => {
//     const prompt = req.body.prompt;
//     // Your code here
//     res.send('Route 2 was successful');
// });



const hello = defaultEndpointsFactory.build({
    method: 'get',

    input: z.object({
        // for empty input use z.object({})
        name: z.string().optional(),
    }),

    output: z.object({
        greetings: z.string(),
        createdAt: ez.dateOut(), // Date -> string
    }),

    handler: async ({ input: { name }, options, logger }) => {
        logger.debug('Options:', options); // middlewares provide options
        return { greetings: `Hello, ${name ?? 'World'}. Happy coding!`, createdAt: new Date() };
    },
});

const getImage = fileStreamingEndpointsFactory.build({
    shortDescription: 'Retrieves generated image.',
    description: 'The detailed explanaition on what this endpoint does.',
    method: 'get',

    input: z.object({
        filename: z.string(),
        size: z.enum(['xs', 's', 'm', 'l', 'xl', 'xxl']).optional(),
    }),

    output: z.object({
        filename: z.string().optional(),
        path: z.string().optional(),
    }),

    handler: async ({ input, options, logger }) => {
        const { filename } = input;
        logger.debug('Options:', options); // middlewares provide options

        const path = `/Users/or/projects/ComfyUI/output/${filename}`;
        const isExists = existsSync(path);
        if (!isExists) return {};

        return { filename, path };
    },
});

const prompt = defaultEndpointsFactory
    .addMiddleware(authMiddleware)
    .build({
        method: 'post',

        input: z.object({
            prompt: z.string({ required_error: 'Prompt is required' }).max(500, 'Must be 500 or fewer characters long'),
        }),

        output: z.object({
            prompt: z.string(),
        }),

        handler: async ({ input: { prompt }, options, logger }) => {
            logger.debug('Options:', options); // middlewares provide options
            return { prompt };
        },
    });


const routes = {
    hello,

    // 'view': {
    //     ':id': getImage
    // },
    'view': getImage,
    prompt
};
export default routes;