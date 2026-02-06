/**
 * Open Wegram Bot - Cloudflare Worker Entry Point
 * A two-way private messaging Telegram bot
 *
 * GitHub Repository: https://github.com/wozulong/open-wegram-bot
 */

import {handleRequest, cleanupExpiredVerifications} from './core.js';

export default {
    async fetch(request, env, ctx) {
        const config = {
            prefix: env.PREFIX || 'public',
            secretToken: env.SECRET_TOKEN || '',
            // 修改点：添加人机验证功能 - 添加验证配置
            verificationEnabled: env.VERIFICATION_ENABLED === 'true',
            verificationTimeoutDays: parseInt(env.VERIFICATION_TIMEOUT_DAYS || '7')
        };

        // 修改点：添加人机验证功能 - 传递 KV binding
        return handleRequest(request, config, env.VERIFICATION_KV);
    },

    // 修改点：添加定时清理功能 - Cron Trigger handler
    async scheduled(event, env, ctx) {
        const timeoutDays = parseInt(env.VERIFICATION_TIMEOUT_DAYS || '7');

        try {
            const result = await cleanupExpiredVerifications(env.VERIFICATION_KV, timeoutDays);
            console.log('Scheduled cleanup result:', result);
        } catch (error) {
            console.error('Scheduled cleanup error:', error);
        }
    }
};