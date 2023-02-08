import { type Context, type NarrowedContext } from 'telegraf';
import { message } from 'telegraf/filters';
import { type Message, type Update } from 'telegraf/types';

import { logger } from '../../services/logger.js';
import { getIdFromUrl } from '../../services/telegram-bot/helpers.js';
import { getBot, sendAdminMessage, sendLoadingMessage } from '../../services/telegram-bot/telegram-bot.js';

import { digestChannel } from './digest-channel.js';
import { texts } from './texts.js';

async function mapDigestChannelError(error: unknown, ctx: NarrowedContext<Context, Update.MessageUpdate<Message.TextMessage>>) {
    logger.error(error);

    if (error instanceof Error) {
        if (error.message.includes('chat not found'))
            return ctx.reply(texts.errors.nonPublicChannel);
        if (error.message.includes('Invalid channel'))
            return ctx.reply(texts.errors.nonPublicChannel);
    }

    return ctx.reply(texts.errors.general);
}

async function onDigestChannelSuccess(summary: string, ctx: NarrowedContext<Context, Update.MessageUpdate<Message.TextMessage>>) {
    await ctx.reply(summary, { disable_web_page_preview: true });
    sendAdminMessage(summary);
}

async function onTextMessage(ctx: NarrowedContext<Context, Update.MessageUpdate<Message.TextMessage>>) {
    const { text = '' } = ctx.message;
    const channelId = getIdFromUrl(text);
    if (!channelId) return;

    logger.debug(`[onTextMessage] from ${ctx.from.username ?? ctx.from.id}: ${text}`);

    const { stopLoading } = await sendLoadingMessage(ctx.chat.id, texts.digestingChannel);

    try {
        const summary = await digestChannel(channelId);
        await stopLoading();
        onDigestChannelSuccess(summary, ctx);
    } catch (error) {
        mapDigestChannelError(error, ctx);
        stopLoading();
    }
}

function subscribeToCommands() {
    const bot = getBot();

    bot.start(async ctx => ctx.replyWithHTML(texts.welcomeMessage, { disable_web_page_preview: true }));
    bot.help(async ctx => ctx.replyWithHTML(texts.welcomeMessage, { disable_web_page_preview: true }));
    bot.command('support', async ctx => ctx.reply(texts.supportMessage));
    bot.on(message('text'), async ctx => onTextMessage(ctx));
}

async function setCommands() {
    const bot = getBot();

    await bot.telegram.setMyCommands([
        {
            command: '/help',
            description: texts.commands.helpDescription,
        },
        {
            command: '/support',
            description: texts.commands.supportDescription,
        }
    ]);
}

export async function init() {
    const bot = getBot();

    setCommands();
    subscribeToCommands();
    return bot.launch();
}
