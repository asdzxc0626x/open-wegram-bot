/**
 * Open Wegram Bot - Core Logic
 * Shared code between Cloudflare Worker and Vercel deployments
 */

export function validateSecretToken(token) {
    return token.length > 15 && /[A-Z]/.test(token) && /[a-z]/.test(token) && /[0-9]/.test(token);
}

// 修改点：增强数学题复杂度 - 计算表达式（遵循运算优先级）
function calculateExpression(nums, ops) {
    let numbers = [...nums];
    let operators = [...ops];

    // 第一步：处理所有乘法
    for (let i = 0; i < operators.length; i++) {
        if (operators[i] === '×') {
            const result = numbers[i] * numbers[i + 1];
            numbers.splice(i, 2, result);
            operators.splice(i, 1);
            i--;
        }
    }

    // 第二步：从左到右处理加减法
    let result = numbers[0];
    for (let i = 0; i < operators.length; i++) {
        if (operators[i] === '+') {
            result += numbers[i + 1];
        } else if (operators[i] === '-') {
            result -= numbers[i + 1];
        }
    }

    return result;
}

// 修改点：增强数学题复杂度 - 简单题降级方案
function generateSimpleMathQuestion() {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operators = ['+', '-', '×'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let answer, question;
    switch (operator) {
        case '+':
            answer = num1 + num2;
            question = `${num1} + ${num2} = ?`;
            break;
        case '-':
            if (num1 >= num2) {
                answer = num1 - num2;
                question = `${num1} - ${num2} = ?`;
            } else {
                answer = num2 - num1;
                question = `${num2} - ${num1} = ?`;
            }
            break;
        case '×':
            answer = num1 * num2;
            question = `${num1} × ${num2} = ?`;
            break;
    }
    return { question, answer };
}

// 修改点：增强数学题复杂度 - 生成包含3个运算符的表达式
export function generateMathQuestion() {
    const maxRetries = 10;

    for (let retry = 0; retry < maxRetries; retry++) {
        // 生成4个数字和3个运算符
        const nums = [
            Math.floor(Math.random() * 10) + 1,  // 1-10
            Math.floor(Math.random() * 5) + 1,   // 1-5 (用于乘法)
            Math.floor(Math.random() * 10) + 1,  // 1-10
            Math.floor(Math.random() * 10) + 1   // 1-10
        ];

        const operators = ['+', '-', '×'];
        const ops = [
            operators[Math.floor(Math.random() * operators.length)],
            operators[Math.floor(Math.random() * operators.length)],
            operators[Math.floor(Math.random() * operators.length)]
        ];

        // 计算答案
        const answer = calculateExpression(nums, ops);

        // 确保结果为正整数
        if (Number.isInteger(answer) && answer > 0 && answer < 1000) {
            const question = `${nums[0]} ${ops[0]} ${nums[1]} ${ops[1]} ${nums[2]} ${ops[2]} ${nums[3]} = ?`;
            return { question, answer };
        }
    }

    // 降级：生成简单题
    return generateSimpleMathQuestion();
}

// 修改点：失败惩罚机制 - 检查用户是否被禁用
export async function checkUserBan(kv, botToken, userId) {
    if (!kv) {
        return { banned: false };
    }

    try {
        const key = `verification_ban:${botToken}:${userId}`;
        const data = await kv.get(key);

        if (!data) {
            return { banned: false };
        }

        const record = JSON.parse(data);
        const now = Date.now();

        // 检查禁用是否已过期
        if (now >= record.banExpiresAt) {
            // 禁用已过期，删除记录
            await kv.delete(key);
            return { banned: false };
        }

        // 仍在禁用期内
        const remainingMs = record.banExpiresAt - now;
        const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

        return {
            banned: true,
            remainingHours,
            banExpiresAt: record.banExpiresAt
        };
    } catch (error) {
        console.error('Error checking user ban:', error);
        return { banned: false };
    }
}

// 修改点：失败惩罚机制 - 记录验证失败
export async function recordVerificationFailure(kv, botToken, userId) {
    if (!kv) {
        return { banned: false };
    }

    try {
        const key = `verification_ban:${botToken}:${userId}`;
        const now = Date.now();
        const data = await kv.get(key);

        let record;
        if (data) {
            record = JSON.parse(data);
            record.failedAttempts++;
            record.lastFailedAt = now;
        } else {
            record = {
                userId,
                failedAttempts: 1,
                lastFailedAt: now
            };
        }

        // 检查是否达到禁用阈值
        if (record.failedAttempts >= 3) {
            const banDurationMs = 24 * 60 * 60 * 1000; // 24 小时
            record.bannedAt = now;
            record.banExpiresAt = now + banDurationMs;
        }

        await kv.put(key, JSON.stringify(record));

        return {
            banned: record.failedAttempts >= 3,
            failedAttempts: record.failedAttempts,
            banExpiresAt: record.banExpiresAt
        };
    } catch (error) {
        console.error('Error recording verification failure:', error);
        return { banned: false };
    }
}

// 修改点：失败惩罚机制 - 清除禁用记录
export async function clearUserBan(kv, botToken, userId) {
    if (!kv) {
        return;
    }

    try {
        const key = `verification_ban:${botToken}:${userId}`;
        await kv.delete(key);
    } catch (error) {
        console.error('Error clearing user ban:', error);
    }
}

// 修改点：添加人机验证功能 - 检查用户验证状态
export async function checkVerification(kv, botToken, userId, timeoutDays) {
    if (!kv) {
        return { verified: true, needReVerify: false };
    }

    try {
        const key = `verified_user:${botToken}:${userId}`;
        const data = await kv.get(key);

        if (!data) {
            return { verified: false, needReVerify: false };
        }

        const record = JSON.parse(data);
        const now = Date.now();
        const timeoutMs = timeoutDays * 24 * 60 * 60 * 1000;

        if (now - record.lastMessageTime > timeoutMs) {
            return { verified: true, needReVerify: true };
        }

        return { verified: true, needReVerify: false };
    } catch (error) {
        console.error('Error checking verification:', error);
        return { verified: true, needReVerify: false };
    }
}

// 修改点：添加人机验证功能 - 更新验证记录
export async function updateVerification(kv, botToken, userId) {
    if (!kv) {
        return;
    }

    try {
        const key = `verified_user:${botToken}:${userId}`;
        const now = Date.now();

        const existingData = await kv.get(key);
        let record;

        if (existingData) {
            record = JSON.parse(existingData);
            record.lastMessageTime = now;
        } else {
            record = {
                userId,
                lastMessageTime: now,
                verifiedAt: now
            };
        }

        await kv.put(key, JSON.stringify(record));
    } catch (error) {
        console.error('Error updating verification:', error);
    }
}

// 修改点：添加人机验证功能 - 发送验证消息
export async function sendVerificationMessage(botToken, chatId, userId) {
    try {
        const { question, answer } = generateMathQuestion();

        // 生成3个错误答案
        const wrongAnswers = [];
        while (wrongAnswers.length < 3) {
            const wrong = answer + Math.floor(Math.random() * 10) - 5;
            if (wrong !== answer && !wrongAnswers.includes(wrong) && wrong >= 0) {
                wrongAnswers.push(wrong);
            }
        }

        // 将正确答案和错误答案混合并随机排序
        const allAnswers = [answer, ...wrongAnswers];
        allAnswers.sort(() => Math.random() - 0.5);

        // 构造 inline_keyboard
        const keyboard = allAnswers.map(ans => [{
            text: ans.toString(),
            callback_data: `verify:${userId}:${ans}`
        }]);

        await postToTelegramApi(botToken, 'sendMessage', {
            chat_id: chatId,
            text: `🤖 请完成验证以继续使用：\n\n${question}\n\n请选择正确答案：`,
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        console.error('Error sending verification message:', error);
    }
}

// 修改点：增强数学题复杂度 - 从消息中解析并计算复杂表达式
function parseAndCalculateFromMessage(messageText) {
    // 提取表达式：匹配 "数字 运算符 数字 运算符 数字 运算符 数字 = ?"
    const complexMatch = messageText.match(/(\d+)\s*([+\-×])\s*(\d+)\s*([+\-×])\s*(\d+)\s*([+\-×])\s*(\d+)\s*=\s*\?/);

    if (complexMatch) {
        // 复杂表达式（4个数字，3个运算符）
        const nums = [
            parseInt(complexMatch[1]),
            parseInt(complexMatch[3]),
            parseInt(complexMatch[5]),
            parseInt(complexMatch[7])
        ];
        const ops = [
            complexMatch[2],
            complexMatch[4],
            complexMatch[6]
        ];
        return calculateExpression(nums, ops);
    }

    // 简单表达式（2个数字，1个运算符）
    const simpleMatch = messageText.match(/(\d+)\s*([+\-×])\s*(\d+)\s*=\s*\?/);
    if (simpleMatch) {
        const num1 = parseInt(simpleMatch[1]);
        const operator = simpleMatch[2];
        const num2 = parseInt(simpleMatch[3]);

        switch (operator) {
            case '+':
                return num1 + num2;
            case '-':
                return num1 - num2;
            case '×':
                return num1 * num2;
        }
    }

    return null;
}

// 修改点：增强数学题复杂度 - 处理 callback_query（支持复杂表达式）
export async function handleCallbackQuery(update, botToken, kv, ownerUid) {
    const callbackQuery = update.callback_query;
    const callbackData = callbackQuery.data;

    try {
        // 解析 callback_data: verify:{userId}:{answer}
        if (!callbackData.startsWith('verify:')) {
            return new Response('OK');
        }

        const parts = callbackData.split(':');
        if (parts.length !== 3) {
            return new Response('OK');
        }

        const userId = parts[1];
        const userAnswer = parseInt(parts[2]);

        // 从原始消息中提取问题并计算正确答案
        const messageText = callbackQuery.message.text;
        const correctAnswer = parseAndCalculateFromMessage(messageText);

        if (correctAnswer === null) {
            return new Response('OK');
        }

        if (userAnswer === correctAnswer) {
            // 答案正确，存储验证状态
            await updateVerification(kv, botToken, userId);

            // 修改点：失败惩罚机制 - 清除禁用记录
            await clearUserBan(kv, botToken, userId);

            // 回复验证成功
            await postToTelegramApi(botToken, 'answerCallbackQuery', {
                callback_query_id: callbackQuery.id,
                text: '✅ 验证成功！'
            });

            // 编辑原消息
            await postToTelegramApi(botToken, 'editMessageText', {
                chat_id: callbackQuery.message.chat.id,
                message_id: callbackQuery.message.message_id,
                text: '✅ 验证成功！您现在可以发送消息了。'
            });
        } else {
            // 修改点：失败惩罚机制 - 记录失败并检查是否需要禁用
            const failureResult = await recordVerificationFailure(kv, botToken, userId);

            if (failureResult.banned) {
                // 用户被禁用
                await postToTelegramApi(botToken, 'answerCallbackQuery', {
                    callback_query_id: callbackQuery.id,
                    text: '❌ 验证失败次数过多，已被禁用 24 小时'
                });

                // 编辑原消息
                await postToTelegramApi(botToken, 'editMessageText', {
                    chat_id: callbackQuery.message.chat.id,
                    message_id: callbackQuery.message.message_id,
                    text: '⛔ 您因多次验证失败已被暂时禁用 24 小时。\n\n请稍后再试。'
                });
            } else {
                // 答案错误但未被禁用
                const remainingAttempts = 3 - failureResult.failedAttempts;

                await postToTelegramApi(botToken, 'answerCallbackQuery', {
                    callback_query_id: callbackQuery.id,
                    text: `❌ 答案错误，剩余 ${remainingAttempts} 次机会`
                });

                // 重新发送验证消息
                await sendVerificationMessage(botToken, callbackQuery.message.chat.id, userId);
            }
        }

        return new Response('OK');
    } catch (error) {
        console.error('Error handling callback query:', error);
        return new Response('OK');
    }
}

export function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {'Content-Type': 'application/json'}
    });
}

export async function postToTelegramApi(token, method, body) {
    return fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });
}

export async function handleInstall(request, ownerUid, botToken, prefix, secretToken) {
    if (!validateSecretToken(secretToken)) {
        return jsonResponse({
            success: false,
            message: 'Secret token must be at least 16 characters and contain uppercase letters, lowercase letters, and numbers.'
        }, 400);
    }

    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.hostname}`;
    const webhookUrl = `${baseUrl}/${prefix}/webhook/${ownerUid}/${botToken}`;

    try {
        // 修改点：添加人机验证功能 - 添加 callback_query 到 allowed_updates
        const response = await postToTelegramApi(botToken, 'setWebhook', {
            url: webhookUrl,
            allowed_updates: ['message', 'callback_query'],
            secret_token: secretToken
        });

        const result = await response.json();
        if (result.ok) {
            return jsonResponse({success: true, message: 'Webhook successfully installed.'});
        }

        return jsonResponse({success: false, message: `Failed to install webhook: ${result.description}`}, 400);
    } catch (error) {
        return jsonResponse({success: false, message: `Error installing webhook: ${error.message}`}, 500);
    }
}

export async function handleUninstall(botToken, secretToken) {
    if (!validateSecretToken(secretToken)) {
        return jsonResponse({
            success: false,
            message: 'Secret token must be at least 16 characters and contain uppercase letters, lowercase letters, and numbers.'
        }, 400);
    }

    try {
        const response = await postToTelegramApi(botToken, 'deleteWebhook', {})

        const result = await response.json();
        if (result.ok) {
            return jsonResponse({success: true, message: 'Webhook successfully uninstalled.'});
        }

        return jsonResponse({success: false, message: `Failed to uninstall webhook: ${result.description}`}, 400);
    } catch (error) {
        return jsonResponse({success: false, message: `Error uninstalling webhook: ${error.message}`}, 500);
    }
}

// 修改点：添加人机验证功能 - 添加 kv 和 config 参数
export async function handleWebhook(request, ownerUid, botToken, secretToken, kv, config) {
    if (secretToken !== request.headers.get('X-Telegram-Bot-Api-Secret-Token')) {
        return new Response('Unauthorized', {status: 401});
    }

    const update = await request.json();

    // 修改点：添加人机验证功能 - 处理 callback_query
    if (update.callback_query) {
        return handleCallbackQuery(update, botToken, kv, ownerUid);
    }

    if (!update.message) {
        return new Response('OK');
    }

    const message = update.message;
    const reply = message.reply_to_message;
    try {
        // 修改点：Owner 完全豁免验证 - Owner 回复用户消息时不需要验证
        if (reply && message.chat.id.toString() === ownerUid) {
            // Owner 回复用户消息的场景 - Owner 完全豁免验证
            const rm = reply.reply_markup;
            if (rm && rm.inline_keyboard && rm.inline_keyboard.length > 0) {
                let senderUid = rm.inline_keyboard[0][0].callback_data;
                if (!senderUid) {
                    senderUid = rm.inline_keyboard[0][0].url.split('tg://user?id=')[1];
                }

                await postToTelegramApi(botToken, 'copyMessage', {
                    chat_id: parseInt(senderUid),
                    from_chat_id: message.chat.id,
                    message_id: message.message_id
                });
            }

            return new Response('OK');
        }

        if ("/start" === message.text) {
            return new Response('OK');
        }

        const sender = message.chat;
        const senderUid = sender.id.toString();
        const senderName = sender.username ? `@${sender.username}` : [sender.first_name, sender.last_name].filter(Boolean).join(' ');

        // 修改点：Owner 完全豁免验证 - Owner 直接发送消息时也不需要验证
        if (senderUid === ownerUid) {
            // Owner 直接发送消息（非回复场景）- 完全豁免验证，直接返回
            return new Response('OK');
        }

        // 修改点：失败惩罚机制 - 验证检查（普通用户）
        if (config && config.verificationEnabled && kv) {
            // 先检查用户是否被禁用
            const banStatus = await checkUserBan(kv, botToken, senderUid);

            if (banStatus.banned) {
                // 用户被禁用，发送提示消息
                await postToTelegramApi(botToken, 'sendMessage', {
                    chat_id: message.chat.id,
                    text: `⛔ 您因多次验证失败已被暂时禁用。\n\n请在 ${banStatus.remainingHours} 小时后再试。`
                });
                return new Response('OK');
            }

            // 检查验证状态
            const verifyResult = await checkVerification(kv, botToken, senderUid, config.verificationTimeoutDays);

            if (!verifyResult.verified || verifyResult.needReVerify) {
                await sendVerificationMessage(botToken, message.chat.id, senderUid);
                return new Response('OK');
            }

            // 更新最后通信时间
            await updateVerification(kv, botToken, senderUid);
        }

        const copyMessage = async function (withUrl = false) {
            const ik = [[{
                text: `🔏 From: ${senderName} (${senderUid})`,
                callback_data: senderUid,
            }]];

            if (withUrl) {
                ik[0][0].text = `🔓 From: ${senderName} (${senderUid})`
                ik[0][0].url = `tg://user?id=${senderUid}`;
            }

            return await postToTelegramApi(botToken, 'copyMessage', {
                chat_id: parseInt(ownerUid),
                from_chat_id: message.chat.id,
                message_id: message.message_id,
                reply_markup: {inline_keyboard: ik}
            });
        }

        const response = await copyMessage(true);
        if (!response.ok) {
            await copyMessage();
        }

        return new Response('OK');
    } catch (error) {
        console.error('Error handling webhook:', error);
        return new Response('Internal Server Error', {status: 500});
    }
}

// 修改点：添加定时清理功能 - 清理过期的验证记录和禁用记录
export async function cleanupExpiredVerifications(kv, timeoutDays) {
    if (!kv) {
        return { success: false, message: 'KV namespace not available' };
    }

    try {
        const now = Date.now();
        const timeoutMs = timeoutDays * 24 * 60 * 60 * 1000;
        let deletedVerifications = 0;
        let deletedBans = 0;
        let scannedCount = 0;

        // 清理验证记录
        const verificationList = await kv.list({ prefix: 'verified_user:' });
        for (const key of verificationList.keys) {
            scannedCount++;
            const data = await kv.get(key.name);

            if (data) {
                const record = JSON.parse(data);
                // 如果记录超过超时时间，删除它
                if (now - record.lastMessageTime > timeoutMs) {
                    await kv.delete(key.name);
                    deletedVerifications++;
                }
            }
        }

        // 修改点：失败惩罚机制 - 清理过期的禁用记录
        const banList = await kv.list({ prefix: 'verification_ban:' });
        for (const key of banList.keys) {
            scannedCount++;
            const data = await kv.get(key.name);

            if (data) {
                const record = JSON.parse(data);
                // 如果禁用已过期，删除记录
                if (record.banExpiresAt && now >= record.banExpiresAt) {
                    await kv.delete(key.name);
                    deletedBans++;
                }
            }
        }

        return {
            success: true,
            message: `Cleanup completed: scanned ${scannedCount} records, deleted ${deletedVerifications} verifications, ${deletedBans} bans`,
            scannedCount,
            deletedVerifications,
            deletedBans
        };
    } catch (error) {
        console.error('Error cleaning up expired verifications:', error);
        return { success: false, message: `Error: ${error.message}` };
    }
}

// 修改点：添加人机验证功能 - 添加 kv 参数
export async function handleRequest(request, config, kv) {
    const {prefix, secretToken} = config;

    const url = new URL(request.url);
    const path = url.pathname;

    const INSTALL_PATTERN = new RegExp(`^/${prefix}/install/([^/]+)/([^/]+)$`);
    const UNINSTALL_PATTERN = new RegExp(`^/${prefix}/uninstall/([^/]+)$`);
    const WEBHOOK_PATTERN = new RegExp(`^/${prefix}/webhook/([^/]+)/([^/]+)$`);
    // 修改点：添加定时清理功能 - 手动清理端点
    const CLEANUP_PATTERN = new RegExp(`^/${prefix}/cleanup$`);

    let match;

    if (match = path.match(INSTALL_PATTERN)) {
        return handleInstall(request, match[1], match[2], prefix, secretToken);
    }

    if (match = path.match(UNINSTALL_PATTERN)) {
        return handleUninstall(match[1], secretToken);
    }

    if (match = path.match(WEBHOOK_PATTERN)) {
        // 修改点：添加人机验证功能 - 传递 kv 和 config 到 handleWebhook
        return handleWebhook(request, match[1], match[2], secretToken, kv, config);
    }

    // 修改点：添加定时清理功能 - 手动清理端点（需要 Bearer token 认证）
    if (path.match(CLEANUP_PATTERN)) {
        // 验证 Authorization header
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${secretToken}`) {
            return new Response('Unauthorized', {status: 401});
        }

        const result = await cleanupExpiredVerifications(kv, config.verificationTimeoutDays);
        return jsonResponse(result);
    }

    return new Response('Not Found', {status: 404});
}