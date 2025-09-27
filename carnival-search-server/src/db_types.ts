import { connector_group_access_table, connector_user_access_table, connector_table, document_chunk_table, document_table, org_table, org_user_map_table, user_group_table, user_invitation_table, user_table, user_connector_table } from "./db/schema";

export type Org = typeof org_table.$inferSelect;
export type User = typeof user_table.$inferSelect;
export type OrgUserMap = typeof org_user_map_table.$inferSelect;
export type UserGroup = typeof user_group_table.$inferSelect;
export type Connector = typeof connector_table.$inferSelect;
export type UserConnector = typeof user_connector_table.$inferSelect;
export type Document = typeof document_table.$inferSelect;
export type DocumentChunk = typeof document_chunk_table.$inferSelect;
export type ConnectorUserAccess = typeof connector_user_access_table.$inferSelect;
export type ConnectorGroupAccess = typeof connector_group_access_table.$inferSelect;
export type UserInvitation = typeof user_invitation_table.$inferInsert;