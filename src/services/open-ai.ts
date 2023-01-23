import { Configuration, type CreateCompletionRequest, OpenAIApi } from 'openai';

import { getOpenAiApiKey } from '../config.js';
import { CustomError } from '../errors.js';

const configuration = new Configuration({
    apiKey: getOpenAiApiKey()
});
const openai = new OpenAIApi(configuration);

export async function createCompletion(payload: Partial<CreateCompletionRequest>) {
    try {
        const res = await openai.createCompletion({
            model: 'text-davinci-003',
            ...payload
        });
        return res.data.choices[0].text;
    } catch (error: unknown) {
        if (error.response)
            throw new CustomError('[services/open-ai/createCompletion] failed to createCompletion', error.response.data);

        throw new CustomError('[services/open-ai/createCompletion] failed to createCompletion', error.message);
    }
}
