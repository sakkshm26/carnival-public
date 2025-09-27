import axios from "axios";
import { DB } from "../../db";
import { AppType, connector_table, document_chunk_table, document_table, DocumentType, SyncStatus } from "../../db/schema";
import { config } from "../../providers/config";
import { eq, and } from "drizzle-orm";
import { text_splitter } from "../../langchain";
import { Connector } from "../../db_types";
import { jsonExtract } from "../../utils";
import { add_vector_entity_queue, delete_vector_entity_queue } from "../../providers/queues";

const fetchPullRequestReviewComments = async (
    repo_full_name: string,
    pull_request_number: number,
    access_token: string
): Promise<string> => {
    let pr_content = "";
    let comments_page = 1;
    let has_more_comments = true;

    while (has_more_comments) {
        const comments_response = await axios.get(`https://api.github.com/repos/${repo_full_name}/pulls/${pull_request_number}/comments`, {
            headers: {
                Authorization: `token ${access_token}`,
                Accept: 'application/vnd.github.v3+json'
            },
            params: {
                page: comments_page,
                per_page: 100
            }
        });

        if (comments_response.data.length > 0) {
            for (const comment of comments_response.data) {
                if (comment.body) {
                    pr_content += `\nComment by ${comment.user.login}: ${comment.body}`;
                }
            }
            comments_page++;
        } else {
            has_more_comments = false;
        }
    }

    return pr_content;
};

const fetchPullRequestComments = async (
    repo_full_name: string,
    pull_request_number: number,
    access_token: string
): Promise<string> => {
    let pr_content = "";
    let comments_page = 1;
    let has_more_comments = true;

    while (has_more_comments) {
        const comments_response = await axios.get(`https://api.github.com/repos/${repo_full_name}/issues/${pull_request_number}/comments`, {
            headers: {
                Authorization: `token ${access_token}`,
                Accept: 'application/vnd.github.v3+json'
            },
            params: {
                page: comments_page,
                per_page: 100
            }
        });

        if (comments_response.data.length > 0) {
            for (const comment of comments_response.data) {
                if (comment.body) {
                    pr_content += `\nComment by ${comment.user.login}: ${comment.body}`;
                }
            }
            comments_page++;
        } else {
            has_more_comments = false;
        }
    }

    return pr_content;
};

const processPullRequests = async (
    repo: any,
    access_token: string,
    org_id: string,
    connector_id: string
): Promise<void> => {
    // let pull_req_page = 1;
    // let has_more_pull_reqs = true;

    // while (has_more_pull_reqs) {
    //     const pull_req_response = await axios.get(`https://api.github.com/repos/${repo.full_name}/pulls?state=all`, {
    //         headers: {
    //             Authorization: `token ${access_token}`,
    //             Accept: 'application/vnd.github.v3+json'
    //         },
    //         params: {
    //             page: pull_req_page,
    //             per_page: 100
    //         }
    //     });

    //     if (pull_req_response.data.length < 100) {
    //         has_more_pull_reqs = false;
    //     }

    //     for (const pull_req of pull_req_response.data) {
    //         let pr_content = `${pull_req.title}`;

    //         if (pull_req.body) {
    //             pr_content += ` ${pull_req.body}`;
    //         }

    //         const review_comments = await fetchPullRequestReviewComments(
    //             repo.full_name,
    //             pull_req.number,
    //             access_token
    //         );
    //         pr_content += review_comments;

    //         const comments = await fetchPullRequestComments(
    //             repo.full_name,
    //             pull_req.number,
    //             access_token
    //         );

    //         pr_content += comments;

    //         const document = (await DB.insert(document_table).values({
    //             fk_document_org: org_id,
    //             fk_document_connector: connector_id,
    //             title: pull_req.title,
    //             link: pull_req.html_url,
    //             type: DocumentType.PULL_REQUEST,
    //             metadata: {
    //                 id: pull_req.id,
    //                 number: pull_req.number,
    //                 state: pull_req.state,
    //                 created_at: new Date(pull_req.created_at),
    //                 updated_at: new Date(pull_req.updated_at),
    //                 created_by_user_id: pull_req.user.id,
    //                 assignees_user_ids: pull_req.assignees.map((assignee: any) => assignee.id),
    //                 requested_reviewers_user_ids: pull_req.requested_reviewers?.map((reviewer: any) => reviewer.id) || [],
    //                 closed_at: pull_req.closed_at ? new Date(pull_req.closed_at) : null,
    //                 merged_at: pull_req.merged_at ? new Date(pull_req.merged_at) : null
    //             }
    //         }).returning())[0];

    //         const chunks = await text_splitter.splitText(pr_content);

    //         await Promise.all(chunks.map(async (chunk, index) => {
    //             await DB.insert(document_chunk_table).values({
    //                 fk_chunk_org: org_id,
    //                 fk_chunk_document: document.id,
    //                 chunk_index: index,
    //                 content: chunk
    //             });

    //             /* await axios.post(`${config.flask_server_url}/store_embeddings`, {
    //                 org_id: org_id,
    //                 document_id: document.id,
    //                 connector_id: connector_id,
    //                 chunk,
    //                 chunk_index: index
    //             }); */
    //         }));
    //     }

    //     pull_req_page++;
    // }
};

const fetchIssueComments = async (
    repo_full_name: string,
    issue_number: number,
    access_token: string
): Promise<string> => {
    let issue_content = "";
    let comments_page = 1;
    let has_more_comments = true;

    while (has_more_comments) {
        const comments_response = await axios.get(`https://api.github.com/repos/${repo_full_name}/issues/${issue_number}/comments`, {
            headers: {
                Authorization: `token ${access_token}`,
                Accept: 'application/vnd.github.v3+json'
            },
            params: {
                page: comments_page,
                per_page: 100
            }
        });

        if (comments_response.data.length > 0) {
            for (const comment of comments_response.data) {
                if (comment.body) {
                    issue_content += `\nComment by ${comment.user.login}: ${comment.body}`;
                }
            }
            comments_page++;
        } else {
            has_more_comments = false;
        }
    }

    return issue_content;
}

const processIssues = async (
    repo: any,
    access_token: string,
    org_id: string,
    connector_id: string
) => {
    // let issues_page = 1;
    // let has_more_issues = true;

    // while (has_more_issues) {
    //     const issues_response = await axios.get(`https://api.github.com/repos/${repo.full_name}/issues`, {
    //         headers: {
    //             Authorization: `token ${access_token}`,
    //             Accept: 'application/vnd.github.v3+json'
    //         },
    //         params: {
    //             page: issues_page,
    //             per_page: 100
    //         }
    //     });

    //     if (issues_response.data.length < 100) {
    //         has_more_issues = false;
    //     }

    //     const filtered_issues = issues_response.data.filter((issue: any) => !issue.pull_request);

    //     for (const issue of filtered_issues) {
    //         let issue_content = `${issue.title}`;

    //         if (issue.body) {
    //             issue_content += ` ${issue.body}`;

    //             const comments = await fetchIssueComments(
    //                 repo.full_name,
    //                 issue.number,
    //                 access_token
    //             );

    //             issue_content += comments;

    //             const document = (await DB.insert(document_table).values({
    //                 fk_document_org: org_id,
    //                 fk_document_connector: connector_id,
    //                 title: issue.title,
    //                 link: issue.html_url,
    //                 type: DocumentType.ISSUE,
    //                 metadata: {
    //                     id: issue.id,
    //                     number: issue.number,
    //                     state: issue.state,
    //                     created_at: new Date(issue.created_at),
    //                     updated_at: new Date(issue.updated_at),
    //                     created_by_user_id: issue.user.id,
    //                     assignees_user_ids: issue.assignees.map((assignee: any) => assignee.id),
    //                     closed_at: issue.closed_at ? new Date(issue.closed_at) : null
    //                 }
    //             }).returning())[0];

    //             const chunks = await text_splitter.splitText(issue_content);

    //             await Promise.all(chunks.map(async (chunk, index) => {
    //                 await DB.insert(document_chunk_table).values({
    //                     fk_chunk_org: org_id,
    //                     fk_chunk_document: document.id,
    //                     chunk_index: index,
    //                     content: chunk
    //                 });

    //                 /* await axios.post(`${config.flask_server_url}/store_embeddings`, {
    //                     org_id: org_id,
    //                     document_id: document.id,
    //                     connector_id: connector_id,
    //                     chunk,
    //                     chunk_index: index
    //                 }); */
    //             }))
    //         }
    //     }
    // }
}

const fetchRepositories = async (
    access_token: string,
    org_id: string,
    connector_id: string
): Promise<{ id: number, name: string }[]> => {
    let repo_list: { id: number, name: string }[] = [];
    let repos_page = 1;
    let has_more_repos = true;

    while (has_more_repos) {
        const response = await axios.get('https://api.github.com/user/repos', {
            headers: {
                Authorization: `token ${access_token}`,
                Accept: 'application/vnd.github.v3+json'
            },
            params: {
                page: repos_page,
                per_page: 100
            }
        });

        const repos = response.data;

        if (repos.length < 100) {
            has_more_repos = false;
        }

        for (const repo of repos) {
            repo_list.push({
                id: repo.id,
                name: repo.name
            });

            await processPullRequests(repo, access_token, org_id, connector_id);
            await processIssues(repo, access_token, org_id, connector_id);
        }

        repos_page++;
    }

    return repo_list;
};

const getAllUsers = async (access_token: string) => {
    let users: { id: number, username: string }[] = [];

    let orgs_page = 1;
    let has_more_orgs = true;

    while (has_more_orgs) {
        try {
            const orgs_response = await axios.get('https://api.github.com/user/orgs', {
                headers: {
                    Authorization: `token ${access_token}`,
                    Accept: 'application/vnd.github.v3+json'
                },
                params: {
                    page: orgs_page,
                    per_page: 100
                }
            });

            const orgs = orgs_response.data;

            if (orgs.length < 100) {
                has_more_orgs = false;
            }

            for (const org of orgs) {
                let members_page = 1;
                let has_more_members = true;

                while (has_more_members) {
                    const members_response = await axios.get(`https://api.github.com/orgs/${org.login}/members`, {
                        headers: {
                            Authorization: `token ${access_token}`,
                            Accept: 'application/vnd.github.v3+json'
                        },
                        params: {
                            page: members_page,
                            per_page: 100
                        }
                    });

                    const members = members_response.data;

                    for (const member of members) {
                        if (!users.find(user => user.id === member.id)) {
                            users.push({
                                id: member.id,
                                username: member.login
                            });
                        }
                    }

                    if (members.length < 100) {
                        has_more_members = false;
                    }

                    members_page++;
                }
            }

            orgs_page++;
        } catch (error) {
            console.error("Error fetching GitHub organizations:", error);
            has_more_orgs = false;
        }
    }

    return users;
}

/* export const connectGithub = async (DTO: { org_id: string, connector_name: string, data: { access_token: string } }) => {
    const { org_id, connector_name, data } = DTO;

    const connector = (await DB.insert(connector_table).values({
        fk_connector_org: org_id,
        name: connector_name || "GitHub Connector",
        sync_status: SyncStatus.IN_PROCESS,
        app_type: AppType.GITHUB,
        credentials_data: {
            access_token: data.access_token
        } as GithubConnectorCredentialsData,
        app_data: {
            users: [],
            repositories: [],
            pull_request_states: ["open", "closed"]
        } as GithubConnectorAppData
    }).returning())[0];

    try {
        const users = await getAllUsers(data.access_token);

        const repo_list = await fetchRepositories(
            data.access_token,
            org_id,
            connector.id
        );

        await DB.update(connector_table).set({
            sync_status: SyncStatus.SUCCESS,
            app_data: {
                ...connector.app_data!,
                repositories: repo_list,
                users
            } as GithubConnectorAppData
        }).where(eq(connector_table.id, connector.id));
    } catch (error) {
        await DB.update(connector_table).set({
            sync_status: SyncStatus.FAILED
        }).where(eq(connector_table.id, connector.id));
    }
}; */

const deleteDocumentChunks = async (DTO: { document_id: string }) => {
    const { document_id } = DTO;

    await DB.delete(document_chunk_table).where(eq(document_chunk_table.fk_chunk_document, document_id));

    await delete_vector_entity_queue.add("delete_from_document", {
        document_id
    })
}

export const initialIndexGithub = async (DTO: { connector_id: string, now_date: Date }) => {
    /* const { connector_id, now_date } = DTO;

    const connector: Connector & { credentials_data: GithubConnectorCredentialsData, app_data: GithubConnectorAppData } = (await DB.select().from(connector_table).where(eq(connector_table.id, connector_id)))[0] as any;

    if (!connector) {
        throw new Error(`Connector with ${connector_id} not found`);
    }

    // Fetch all repositories
    const repo_list = await fetchRepositories(
        connector.credentials_data.access_token,
        connector.fk_connector_org,
        connector.id
    );

    // Update connector with repository list
    await DB.update(connector_table).set({
        app_data: {
            ...connector.app_data!,
            repositories: repo_list
        } as GithubConnectorAppData
    }).where(eq(connector_table.id, connector.id)); */
}

export const reindexGithub = async (DTO: { connector_id: string, now_date: Date }) => {
    /* const { connector_id, now_date } = DTO;

    const connector: Connector & { credentials_data: GithubConnectorCredentialsData, app_data: GithubConnectorAppData } = (await DB.select().from(connector_table).where(eq(connector_table.id, connector_id)))[0] as any;

    if (!connector) {
        throw new Error(`Connector with ${connector_id} not found`);
    }

    // Process updated pull requests and issues
    for (const repo of connector.app_data.repositories) {
        // Handle updated pull requests
        let pull_req_page = 1;
        let has_more_pull_reqs = true;

        while (has_more_pull_reqs) {
            const pull_req_response = await axios.get(`https://api.github.com/repos/${repo.name}/pulls?state=all`, {
                headers: {
                    Authorization: `token ${connector.credentials_data.access_token}`,
                    Accept: 'application/vnd.github.v3+json'
                },
                params: {
                    page: pull_req_page,
                    per_page: 100
                }
            });

            if (pull_req_response.data.length < 100) {
                has_more_pull_reqs = false;
            }

            for (const pull_req of pull_req_response.data) {
                const updated_at = new Date(pull_req.updated_at);
                const created_at = new Date(pull_req.created_at);

                // Check if PR was updated or created within our time window
                if ((updated_at >= connector.last_synced_at && updated_at < now_date) ||
                    (created_at >= connector.last_synced_at && created_at < now_date)) {
                    
                    let pr_content = `${pull_req.title}`;
                    if (pull_req.body) {
                        pr_content += ` ${pull_req.body}`;
                    }

                    const review_comments = await fetchPullRequestReviewComments(
                        repo.name,
                        pull_req.number,
                        connector.credentials_data.access_token
                    );
                    pr_content += review_comments;

                    const comments = await fetchPullRequestComments(
                        repo.name,
                        pull_req.number,
                        connector.credentials_data.access_token
                    );
                    pr_content += comments;

                    // Check if document already exists
                    const existing_doc = (await DB.select().from(document_table)
                        .where(
                            and(
                                eq(document_table.fk_document_connector, connector.id),
                                eq(jsonExtract(document_table.metadata, "id"), pull_req.id)
                            )
                        ))[0];

                    if (existing_doc) {
                        // Update existing document
                        await DB.update(document_table).set({
                            title: pull_req.title,
                            metadata: {
                                ...existing_doc.metadata,
                                state: pull_req.state,
                                updated_at: updated_at,
                                closed_at: pull_req.closed_at ? new Date(pull_req.closed_at) : null,
                                merged_at: pull_req.merged_at ? new Date(pull_req.merged_at) : null
                            } as github_pull_request_metadata
                        }).where(eq(document_table.id, existing_doc.id));

                        // Delete existing chunks
                        await deleteDocumentChunks({ document_id: existing_doc.id });

                        // Create new chunks
                        const chunks = await text_splitter.splitText(pr_content);
                        await Promise.all(chunks.map(async (chunk, index) => {
                            await DB.insert(document_chunk_table).values({
                                fk_chunk_org: connector.fk_connector_org,
                                fk_chunk_document: existing_doc.id,
                                chunk_index: index,
                                content: chunk
                            });

                            await add_vector_entity_queue.add("add", {
                                org_id: connector.fk_connector_org,
                                document_id: existing_doc.id,
                                connector_id: connector.id,
                                chunk,
                                chunk_index: index
                            });
                        }));
                    } else {
                        // Create new document
                        const document = (await DB.insert(document_table).values({
                            fk_document_org: connector.fk_connector_org,
                            fk_document_connector: connector.id,
                            title: pull_req.title,
                            link: pull_req.html_url,
                            type: DocumentType.PULL_REQUEST,
                            metadata: {
                                id: pull_req.id,
                                number: pull_req.number,
                                state: pull_req.state,
                                created_at: created_at,
                                updated_at: updated_at,
                                created_by_user_id: pull_req.user.id,
                                assignees_user_ids: pull_req.assignees.map((assignee: any) => assignee.id),
                                requested_reviewers_user_ids: pull_req.requested_reviewers?.map((reviewer: any) => reviewer.id) || [],
                                closed_at: pull_req.closed_at ? new Date(pull_req.closed_at) : null,
                                merged_at: pull_req.merged_at ? new Date(pull_req.merged_at) : null
                            } as github_pull_request_metadata
                        }).returning())[0];

                        const chunks = await text_splitter.splitText(pr_content);
                        await Promise.all(chunks.map(async (chunk, index) => {
                            await DB.insert(document_chunk_table).values({
                                fk_chunk_org: connector.fk_connector_org,
                                fk_chunk_document: document.id,
                                chunk_index: index,
                                content: chunk
                            });

                            await add_vector_entity_queue.add("add", {
                                org_id: connector.fk_connector_org,
                                document_id: document.id,
                                connector_id: connector.id,
                                chunk,
                                chunk_index: index
                            });
                        }));
                    }
                }
            }
            pull_req_page++;
        }

        // Handle updated issues
        let issues_page = 1;
        let has_more_issues = true;

        while (has_more_issues) {
            const issues_response = await axios.get(`https://api.github.com/repos/${repo.name}/issues`, {
                headers: {
                    Authorization: `token ${connector.credentials_data.access_token}`,
                    Accept: 'application/vnd.github.v3+json'
                },
                params: {
                    page: issues_page,
                    per_page: 100
                }
            });

            if (issues_response.data.length < 100) {
                has_more_issues = false;
            }

            const filtered_issues = issues_response.data.filter((issue: any) => !issue.pull_request);

            for (const issue of filtered_issues) {
                const updated_at = new Date(issue.updated_at);
                const created_at = new Date(issue.created_at);

                // Check if issue was updated or created within our time window
                if ((updated_at >= connector.last_synced_at && updated_at < now_date) ||
                    (created_at >= connector.last_synced_at && created_at < now_date)) {
                    
                    let issue_content = `${issue.title}`;
                    if (issue.body) {
                        issue_content += ` ${issue.body}`;
                    }

                    const comments = await fetchIssueComments(
                        repo.name,
                        issue.number,
                        connector.credentials_data.access_token
                    );
                    issue_content += comments;

                    // Check if document already exists
                    const existing_doc = (await DB.select().from(document_table)
                        .where(
                            and(
                                eq(document_table.fk_document_connector, connector.id),
                                eq(jsonExtract(document_table.metadata, "id"), issue.id)
                            )
                        ))[0];

                    if (existing_doc) {
                        // Update existing document
                        await DB.update(document_table).set({
                            title: issue.title,
                            metadata: {
                                ...existing_doc.metadata,
                                state: issue.state,
                                updated_at: updated_at,
                                closed_at: issue.closed_at ? new Date(issue.closed_at) : null
                            } as github_issue_metadata
                        }).where(eq(document_table.id, existing_doc.id));

                        // Delete existing chunks
                        await deleteDocumentChunks({ document_id: existing_doc.id });

                        // Create new chunks
                        const chunks = await text_splitter.splitText(issue_content);
                        await Promise.all(chunks.map(async (chunk, index) => {
                            await DB.insert(document_chunk_table).values({
                                fk_chunk_org: connector.fk_connector_org,
                                fk_chunk_document: existing_doc.id,
                                chunk_index: index,
                                content: chunk
                            });

                            await add_vector_entity_queue.add("add", {
                                org_id: connector.fk_connector_org,
                                document_id: existing_doc.id,
                                connector_id: connector.id,
                                chunk,
                                chunk_index: index
                            });
                        }));
                    } else {
                        // Create new document
                        const document = (await DB.insert(document_table).values({
                            fk_document_org: connector.fk_connector_org,
                            fk_document_connector: connector.id,
                            title: issue.title,
                            link: issue.html_url,
                            type: DocumentType.ISSUE,
                            metadata: {
                                id: issue.id,
                                number: issue.number,
                                state: issue.state,
                                created_at: created_at,
                                updated_at: updated_at,
                                created_by_user_id: issue.user.id,
                                assignees_user_ids: issue.assignees.map((assignee: any) => assignee.id),
                                closed_at: issue.closed_at ? new Date(issue.closed_at) : null
                            } as github_issue_metadata
                        }).returning())[0];

                        const chunks = await text_splitter.splitText(issue_content);
                        await Promise.all(chunks.map(async (chunk, index) => {
                            await DB.insert(document_chunk_table).values({
                                fk_chunk_org: connector.fk_connector_org,
                                fk_chunk_document: document.id,
                                chunk_index: index,
                                content: chunk
                            });

                            await add_vector_entity_queue.add("add", {
                                org_id: connector.fk_connector_org,
                                document_id: document.id,
                                connector_id: connector.id,
                                chunk,
                                chunk_index: index
                            });
                        }));
                    }
                }
            }
            issues_page++;
        }
    } */
}
