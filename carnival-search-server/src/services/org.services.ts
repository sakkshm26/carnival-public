import { and, eq, getTableColumns } from "drizzle-orm";
import { DB } from "../db";
import { org_table, org_user_map_table, OrgUserRole, user_invitation_table, user_table } from "../db/schema";
import CustomError from "../providers/error";

export const OrgService = {
    createOrg: async (DTO: { name: string }) => {
        const { name } = DTO;
        const org = (await DB.insert(org_table).values({
            name
        }).returning())[0];
        return org;
    },

    getUserOrg: async (DTO: { org_id: string }) => {
        const { org_id } = DTO;
        const org = (await DB.select().from(org_table).where(eq(org_table.id, org_id)))[0];
        return org;
    },

    updateOrg: async (DTO: { org_id: string, name?: string }) => {
        const { org_id, name } = DTO;
        let update_data: any = {};

        if (name) {
            update_data.name = name;
        }

        const org = (await DB.update(org_table).set(update_data).where(eq(org_table.id, org_id)).returning())[0];
        return org;
    },

    createUserInvite: async (DTO: { org_id: string, email: string, role: OrgUserRole }) => {
        const { org_id, email, role } = DTO;
        const existing_user = (await DB.select().from(org_user_map_table)
            .leftJoin(user_table, eq(user_table.id, org_user_map_table.fk_org_user))
            .where(and(eq(org_user_map_table.fk_user_org, org_id), eq(user_table.email, email))))[0];
        if (existing_user) {
            throw new CustomError("User already exists in the workspace");
        }
        const existing_invitation = (await DB.select().from(user_invitation_table).where(and(eq(user_invitation_table.email, email), eq(user_invitation_table.fk_invitation_org, org_id))))[0];
        if (existing_invitation) {
            throw new CustomError("User has already been invited to the workspace");
        }
        const response = (await DB.insert(user_invitation_table).values({
            fk_invitation_org: org_id,
            email: email,
            role: role
        }).returning())[0];
        return response;
    },

    deleteUserInvite: async (DTO: { invitation_id: string }) => {
        const { invitation_id } = DTO;
        const response = (await DB.delete(user_invitation_table).where(eq(user_invitation_table.id, invitation_id)).returning())[0];
        return response;
    },

    listInvitedUsers: async (DTO: { org_id: string }) => {
        const { org_id } = DTO;
        const invited_users = await DB.select().from(user_invitation_table).where(eq(user_invitation_table.fk_invitation_org, org_id));
        return invited_users;
    },

    getAllOrgs: async () => {
        const orgs = await DB.select().from(org_table);
        return orgs;
    },

    getOrg: async (DTO: { org_id: string }) => {
        const { org_id } = DTO;
        const org = (await DB.select().from(org_table).where(eq(org_table.id, org_id)))[0];
        return org;
    }
}