import { and, asc, desc, eq, getTableColumns, isNotNull, not, sql } from "drizzle-orm";
import { DB } from "../db";
import { AppType, org_table, org_user_map_table, OrgUserRole, ProfileColorType, user_conversation_message_table, user_conversation_table, user_group_table, user_group_user_map_table, user_invitation_table, user_table, UserInvitationStatus } from "../db/schema";
import CustomError from "../providers/error";
import argon2 from "argon2"
import { getRandomEnumValue, openai } from "../utils";
import axios from "axios";
import { config } from "../providers/config";
import { ilike, inArray } from "drizzle-orm";
import { Response } from "express";
import { ConversationMessageThinkingStep } from "../types";

export const UserService = {
    /* emailPasswordSignup: async (user_data: { email: string, password: string }) => {
        if (typeof user_data.password !== "string" || user_data.password.length < 8) {
            throw new CustomError("Wrong password format");
        }
        const hashed_password = await argon2.hash(user_data.password);
        const { password, ...user_table_columns } = getTableColumns(user_table);
        const random_color = getRandomEnumValue(ProfileColorType);
        const user = await DB.insert(user_table).values({
            email: user_data.email,
            password: hashed_password,
            color: random_color
        }).returning(user_table_columns);
        return user[0];
    }, */

    getUser: async (DTO: { user_id: string }) => {
        const { user_id } = DTO;
        const user_table_columns = getTableColumns(user_table);
        const user = await DB.select(user_table_columns).from(user_table).where(eq(user_table.id, user_id));
        return user[0];
    },

    getUserById: async (DTO: { user_id: string }) => {
        const { user_id } = DTO;
        const user_table_columns = getTableColumns(user_table);
        const user = await DB.select(user_table_columns).from(user_table).where(eq(user_table.id, user_id));
        return user[0];
    },

    updateUser: async (DTO: { user_id: string, display_name?: string }) => {
        const { user_id, display_name } = DTO;
        let update_data: any = {};
        if (display_name) {
            update_data.display_name = display_name;
        }
        const user = (await DB.update(user_table).set(update_data).where(eq(user_table.id, user_id)).returning())[0];
        return user;
    },

    getOrgUsers: async (DTO: { org_id: string }) => {
        const { org_id } = DTO;
        const user_table_columns = getTableColumns(user_table);
        const users = await DB.select({ ...user_table_columns, role: org_user_map_table.role })
            .from(org_user_map_table)
            .innerJoin(user_table, eq(user_table.id, org_user_map_table.fk_org_user))
            .where(and(eq(org_user_map_table.fk_user_org, org_id), isNotNull(user_table.display_name)))
            .orderBy(asc(org_user_map_table.created_at));
        return users;
    },

    addUserToOrg: async (DTO: { org_id: string, user_id: string, role?: OrgUserRole }) => {
        const { org_id, user_id, role } = DTO;
        await DB.insert(org_user_map_table).values({
            fk_org_user: user_id,
            fk_user_org: org_id,
            role: role ?? undefined
        })
        await DB.update(user_table).set({
            fk_user_last_logged_in_org: org_id
        }).where(eq(user_table.id, user_id))
    },

    createUserGroup: async (DTO: { org_id: string, name: string, description?: string, user_ids?: string[] }) => {
        const { org_id, name, description, user_ids } = DTO;
        const user_group = (await DB.insert(user_group_table).values({
            fk_group_org: org_id,
            name: name,
            description
        }).returning())[0];

        if (user_ids?.length) {
            await Promise.all(user_ids.map(async (user_id) => {
                await DB.insert(user_group_user_map_table).values({
                    fk_group_user: user_id,
                    fk_user_group: user_group.id
                })
            }))
        }

        const user_columns = getTableColumns(user_table);

        const found_user_group = (await DB.select({ ...getTableColumns(user_group_table), users: user_columns }).from(user_group_table).where(eq(user_group_table.id, user_group.id))
            .leftJoin(user_group_user_map_table, eq(user_group_user_map_table.fk_user_group, user_group_table.id))
            .leftJoin(user_table, eq(user_table.id, user_group_user_map_table.fk_group_user)))[0];

        return found_user_group;
    },

    getUserGroup: async (DTO: { user_group_id: string }) => {
        const { user_group_id } = DTO;
        const user_columns = getTableColumns(user_table);

        const users = await DB.select(user_columns)
            .from(user_group_user_map_table)
            .innerJoin(user_table, eq(user_table.id, user_group_user_map_table.fk_group_user))
            .where(and(eq(user_group_user_map_table.fk_user_group, user_group_id), isNotNull(user_table.display_name)));

        const group = (await DB.select()
            .from(user_group_table)
            .where(eq(user_group_table.id, user_group_id)))[0];

        return {
            ...group,
            users
        };
    },

    getUserGroups: async (DTO: { org_id: string }) => {
        const { org_id } = DTO;
        const user_groups = await DB.select(getTableColumns(user_group_table)).from(user_group_table).where(eq(user_group_table.fk_group_org, org_id));
        return user_groups;
    },

    updateUserGroup: async (DTO: { user_group_id: string, name?: string, description?: string, user_ids?: string[] }) => {
        const { user_group_id, name, description, user_ids } = DTO;
        const update_data: any = {};

        if (name) {
            update_data.name = name;
        }

        if (description) {
            update_data.description = description;
        }

        if (user_ids) {
            const group_users = await DB.select()
                .from(user_group_user_map_table)
                .where(eq(user_group_user_map_table.fk_user_group, user_group_id))

            const added_users = user_ids.filter((user_id) => !group_users.some((user) => user.fk_group_user === user_id));
            const removed_users = group_users.filter((user) => !user_ids.includes(user.fk_group_user)).map((user) => user.fk_group_user);

            await Promise.all(added_users.map(async (user_id) => {
                await DB.insert(user_group_user_map_table).values({
                    fk_group_user: user_id,
                    fk_user_group: user_group_id
                })
            }))

            await Promise.all(removed_users.map(async (user_id) => {
                await DB.delete(user_group_user_map_table)
                    .where(
                        and(
                            eq(user_group_user_map_table.fk_group_user, user_id),
                            eq(user_group_user_map_table.fk_user_group, user_group_id)
                        )
                    )
            }))
        }

        let user_group: typeof user_group_table.$inferSelect | null = null;

        if (Object.keys(update_data).length) {
            user_group = (await DB.update(user_group_table).set(update_data)
                .where(eq(user_group_table.id, user_group_id)).returning())[0];
        } else {
            user_group = (await DB.select().from(user_group_table).where(eq(user_group_table.id, user_group_id)))[0];
        }

        return user_group;
    },

    getInvites: async (DTO: { user_id: string }) => {
        const { user_id } = DTO;
        const user = (await DB.select().from(user_table).where(eq(user_table.id, user_id)))[0];
        const response = await DB.select({ ...getTableColumns(user_invitation_table), org: getTableColumns(org_table) }).from(user_invitation_table)
            .where(eq(user_invitation_table.email, user.email))
            .leftJoin(org_table, eq(org_table.id, user_invitation_table.fk_invitation_org));
        return response;
    },

    acceptInvite: async (DTO: { invitation_id: string }) => {
        const { invitation_id } = DTO;
        const invitation = (await DB.select().from(user_invitation_table).where(eq(user_invitation_table.id, invitation_id)))[0];
        const found_user = (await DB.select().from(user_table).where(eq(user_table.email, invitation.email)))[0];
        await UserService.addUserToOrg({
            org_id: invitation.fk_invitation_org,
            user_id: found_user.id,
            role: invitation.role
        })
        await DB.delete(user_invitation_table).where(eq(user_invitation_table.id, invitation_id));
    },

    createConversation: async (DTO: { org_id: string, user_id: string }) => {
        const { org_id, user_id } = DTO;

        const conversation = (await DB.insert(user_conversation_table).values({
            fk_conversation_org: org_id,
            fk_conversation_user: user_id,
            title: "No title"
        }).returning())[0];

        return conversation;
    },

    updateConversation: async (DTO: { conversation_id: string, title: string }) => {
        const { conversation_id, title } = DTO;
        const conversation = (await DB.update(user_conversation_table)
            .set({ title })
            .where(eq(user_conversation_table.id, conversation_id))
            .returning()
        )[0];
        return conversation;
    },

    generateConversationTitle: async (DTO: { user_message: string }) => {
        const { user_message } = DTO;
        const response = await openai.chat.completions.create({
            model: "gpt-5-nano",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that generates concise conversation titles. Given a user message, create a short, descriptive title that captures the main topic or intent of the conversation. Only output the generated title, nothing else."
                },
                {
                    role: "user",
                    content: `Generate a title for the following message: ${user_message}`
                }
            ]
        })
        return response.choices[0].message.content;
    },

    getConversationsForUser: async (DTO: { org_id: string, user_id: string }) => {
        const { org_id, user_id } = DTO;
        const conversations = await DB.select({
            ...getTableColumns(user_conversation_table),
            last_message: user_conversation_message_table
        })
            .from(user_conversation_table)
            .where(
                and(
                    eq(user_conversation_table.fk_conversation_org, org_id),
                    eq(user_conversation_table.fk_conversation_user, user_id),
                    eq(user_conversation_message_table.id, sql`(
                        SELECT id
                        FROM ${user_conversation_message_table}
                        WHERE ${user_conversation_message_table.fk_message_conversation} = ${user_conversation_table.id}
                        ORDER BY ${user_conversation_message_table.created_at} DESC LIMIT 1
                    )`),
                )
            )
            .leftJoin(user_conversation_message_table, eq(user_conversation_message_table.fk_message_conversation, user_conversation_table.id))
            .orderBy(desc(user_conversation_message_table.created_at))
            .limit(30);
        return conversations;
    },

    getConversationMessages: async (DTO: { conversation_id: string }) => {
        const { conversation_id } = DTO;
        const messages = await DB.select().from(user_conversation_message_table)
            .where(eq(user_conversation_message_table.fk_message_conversation, conversation_id))
            .orderBy(desc(user_conversation_message_table.created_at));
        return messages;
    },

    createReply: async (DTO: { org_id: string, user_id: string, conversation_id: string, text: string, res: Response, web_search: boolean }) => {
        const { org_id, user_id, conversation_id, text, res, web_search } = DTO;

        let response_finished = false;

        const created_message = (await DB.insert(user_conversation_message_table).values({
            fk_message_conversation: conversation_id,
            fk_message_org: org_id,
            fk_message_user: user_id,
            text,
            sent_by_bot: false
        }).returning())[0];

        const previous_messages = await DB.select().from(user_conversation_message_table)
            .where(
                and(
                    eq(user_conversation_message_table.fk_message_conversation, conversation_id),
                    not(eq(user_conversation_message_table.id, created_message.id))
                )
            )
            .orderBy(desc(user_conversation_message_table.created_at))
            .limit(5);

        const controller = new AbortController();

        res.on('close', async () => {
            if (!response_finished) {
                thinking_steps.push({
                    type: "text",
                    data: "Stopped"
                })

                await DB.insert(user_conversation_message_table).values({
                    fk_message_conversation: conversation_id,
                    fk_message_org: org_id,
                    fk_message_user: user_id,
                    sent_by_bot: true,
                    text: full_response_text,
                    documents: documents,
                    usage_metadata: usage_metadata ?? null,
                    thinking_steps: thinking_steps
                })
            }
            controller.abort();
        });

        const fastApiResponse = await axios.post(`${config.vector_server_url}/chat`, {
            "org_id": org_id,
            "user_id": user_id,
            "query": text,
            "previous_messages": previous_messages.reverse().map(message => ({ sent_by_bot: message.sent_by_bot, text: message.text })),
            web_search
        }, {
            responseType: 'stream',
            signal: controller.signal
        });

        let full_response_text = "";
        let documents: any[] = [];
        let usage_metadata: any = null;
        let thinking_steps: ConversationMessageThinkingStep[] = [{ data: "Searching", type: "text" }];

        const stream = fastApiResponse.data as NodeJS.ReadableStream;

        let buffer = "";

        stream.on('data', (chunk: Buffer) => {
            if (!res.writableEnded) {
                res.write(chunk);
            }

            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.trim() === "") continue;

                try {
                    const parsed = JSON.parse(line);
                    if (parsed.type === 'token') {
                        full_response_text += parsed.data;
                    } else if (parsed.type === 'documents') {
                        documents = parsed.data;
                    } else if (parsed.type === 'metadata') {
                        usage_metadata = parsed.data.usage_metadata;
                    } else if (parsed.type === "tool_choice") {
                        if (parsed.data.name === "generate_final_answer_tool") {
                            thinking_steps.push({
                                type: "text",
                                data: "Finished"
                            });
                        } else {
                            let source_step = thinking_steps.find(step => step.type === "sources");
                            if (source_step) {
                                (source_step.data as { app_type: AppType, title: string }[]).push({
                                    app_type: parsed.data.app_type,
                                    title: parsed.data.name
                                });
                            } else {
                                thinking_steps.push({
                                    type: "sources",
                                    data: [{
                                        app_type: parsed.data.app_type,
                                        title: parsed.data.name
                                    }]
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse stream line:", e, "Line content:", line);
                }
            }
        });

        stream.on('end', async () => {
            try {
                if (!response_finished) {
                    response_finished = true;
                    await DB.insert(user_conversation_message_table).values({
                        fk_message_conversation: conversation_id,
                        fk_message_org: org_id,
                        fk_message_user: user_id,
                        sent_by_bot: true,
                        text: full_response_text,
                        documents: documents,
                        usage_metadata: usage_metadata ?? null,
                        thinking_steps: thinking_steps
                    })
                }

            } catch (dbError) {
                console.error("Failed to save bot message to DB after streaming:", dbError);
            } finally {
                if (!res.writableEnded) {
                    res.end();
                }
            }
        });

        stream.on('error', (err) => {
            if (!res.headersSent) {
                res.status(500).send("Error streaming response from AI server.");
            } else {
                res.end();
            }
        });
    },

    searchConversations: async (DTO: { org_id: string, user_id: string, search_query: string }) => {
        const { org_id, user_id, search_query } = DTO;

        const conversationsByTitle = await DB
            .select()
            .from(user_conversation_table)
            .where(and(
                ilike(user_conversation_table.title, `%${search_query}%`),
                eq(user_conversation_table.fk_conversation_org, org_id),
                eq(user_conversation_table.fk_conversation_user, user_id)
            ));

        const messagesByText = await DB
            .select({
                fk_message_conversation: user_conversation_message_table.fk_message_conversation
            })
            .from(user_conversation_message_table)
            .where(and(
                ilike(user_conversation_message_table.text, `%${search_query}%`),
                eq(user_conversation_message_table.fk_message_org, org_id),
                eq(user_conversation_message_table.fk_message_user, user_id)
            ));

        const conversation_ids_from_title = conversationsByTitle.map(c => c.id);
        const conversation_ids_from_messages = messagesByText.map(m => m.fk_message_conversation);

        const unique_conversation_ids = Array.from(new Set([
            ...conversation_ids_from_title,
            ...conversation_ids_from_messages
        ]));

        const uniqueConversations = await DB
            .select({
                ...getTableColumns(user_conversation_table),
                last_message: user_conversation_message_table
            })
            .from(user_conversation_table)
            .where(and(
                eq(user_conversation_table.fk_conversation_org, org_id),
                eq(user_conversation_table.fk_conversation_user, user_id),
                eq(user_conversation_message_table.id, sql`(
                    SELECT id
                    FROM ${user_conversation_message_table}
                    WHERE ${user_conversation_message_table.fk_message_conversation} = ${user_conversation_table.id}
                    ORDER BY ${user_conversation_message_table.created_at} DESC LIMIT 1
                )`),
                inArray(user_conversation_table.id, unique_conversation_ids)
            ))
            .leftJoin(user_conversation_message_table, eq(user_conversation_message_table.fk_message_conversation, user_conversation_table.id))
            .orderBy(desc(user_conversation_message_table.created_at));

        return uniqueConversations;
    },

    checkandUpdateLambdatestUser: async (DTO: { user_id: string }) => {
        const { user_id } = DTO;

        const found_user = (await DB.select().from(user_table).where(eq(user_table.id, user_id)))[0];

        if (found_user && !found_user.fk_user_last_logged_in_org) {
            await DB.transaction(async tx => {
                await tx.update(user_table).set({
                    fk_user_last_logged_in_org: "a4590786-726f-43ba-91b0-0bbe08be749d"
                }).where(eq(user_table.id, user_id));

                await tx.insert(org_user_map_table).values({
                    fk_org_user: user_id,
                    fk_user_org: "a4590786-726f-43ba-91b0-0bbe08be749d",
                    role: OrgUserRole.ADMIN
                })
            })
        }
    },

    updateMessage: async (DTO: { message_id: string, liked?: boolean }) => {
        const { message_id, liked } = DTO;

        let update_data: any = {};

        if (liked !== undefined) {
            update_data.liked = liked;
        }

        const message = (await DB.update(user_conversation_message_table)
            .set(update_data)
            .where(eq(user_conversation_message_table.id, message_id)).returning())
        [0];
        
        return message;
    }
}