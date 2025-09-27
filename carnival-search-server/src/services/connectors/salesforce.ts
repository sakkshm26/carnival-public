import axios from "axios";
import { DB } from "../../db";
import { AppType, connector_table, document_chunk_table, document_table, DocumentType, SyncStatus } from "../../db/schema";
import { config } from "../../providers/config";
import { eq, and } from "drizzle-orm";
import { text_splitter } from "../../langchain";
import { Connector } from "../../db_types";
import { VectorQueueService } from "../vector_queue.service";
import * as jsforce from "jsforce";

// const DEFAULT_SALESFORCE_OBJECTS = ["Account", "Contact", "Lead", "Opportunity", "Case"];

// const ACCOUNT_FIELDS = ["Id", "Name", "Type", "Phone", "Fax", "Website", "Industry", "AnnualRevenue", "NumberOfEmployees", "Ownership", "TickerSymbol", "Description", "Rating", "CreatedDate"]
// const CASE_FIELDS = ["Id", "CaseNumber", "SuppliedName", "SuppliedEmail", "SuppliedPhone", "SuppliedCompany", "Type", "Status", "Reason", "Origin", "Subject", "Priority", "Description", "IsClosed", "ClosedDate", "CreatedDate", "ContactPhone", "ContactMobile", "ContactEmail", "ContactFax", "Comments"]
// const CONTACT_FIELDS = ["Id", "Name", "Phone", "Fax", "MobilePhone", "Email", "Title", "Department", "AssistantName", "LeadSource", "Birthdate", "Description", "CreatedDate", "IsPriorityRecord"]
// const LEAD_FIELDS = ["Id", "Name", "Title", "Company", "Phone", "MobilePhone", "Fax", "Email", "Website", "Description", "LeadSource", "Status", "Industry", "Rating", "AnnualRevenue", "IsConverted", "CreatedDate", "IsPriorityRecord"]
// const OPPORTUNITY_FIELDS = ["Id", "Name", "Description", "StageName", "Amount", "Probability", "ExpectedRevenue", "CloseDate", "Type", "LeadSource", "IsClosed", "IsWon", "ForecastCategory", "CreatedDate"]

// const EXCLUDED_FIELD_TYPES = ["base64", "blob", "encryptedstring"];

// const COMPOUND_ADDRESS_FIELDS = ["BillingAddress", "ShippingAddress", "MailingAddress", "OtherAddress", "Address"];

export const fetchSalesforceAccessToken = async (DTO: { code: string }) => {
    const { code } = DTO;

    const response = await axios.post("https://login.salesforce.com/services/oauth2/token", {
        grant_type: "authorization_code",
        client_id: config.salesforce_client_id,
        client_secret: config.salesforce_client_secret,
        redirect_uri: config.salesforce_redirect_uri,
        code: code
    }, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

    console.log("res ---->", response.data)

    if (response.status !== 200) {
        throw new Error("Failed to fetch Salesforce access token");
    }

    return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        instance_url: response.data.instance_url
    };
}

// /**
//  * Create jsForce connection with authentication
//  */
// const createSalesforceConnection = (instanceUrl: string, accessToken: string): jsforce.Connection => {
//     const conn = new jsforce.Connection({
//         instanceUrl: instanceUrl,
//         accessToken: accessToken,
//         version: '59.0'
//     });
//     return conn;
// }

// const describeSalesforceObject = (
//     objectType: string,
//     conn: jsforce.Connection
// ): string[] => {
//     try {
//         /* const describe = await conn.sobject(objectType).describe();
        
//         const validFields = describe.fields
//             .filter((field) => {
//                 if (field.compoundFieldName && !field.nameField) {
//                     return false;
//                 }
                
//                 if (EXCLUDED_FIELD_TYPES.includes(field.type.toLowerCase())) {
//                     return false;
//                 }

//                 if (COMPOUND_ADDRESS_FIELDS.includes(field.name)) {
//                     return false;
//                 }

//                 if (!field.name) {
//                     return false;
//                 }

//                 return true;
//             })
//             .map((field) => field.name);

//         return validFields; */

//         if (objectType === "Account") {
//             return ACCOUNT_FIELDS;
//         } else if (objectType === "Contact") {
//             return CONTACT_FIELDS;
//         } else if (objectType === "Lead") {
//             return LEAD_FIELDS;
//         } else if (objectType === "Opportunity") {
//             return OPPORTUNITY_FIELDS;
//         } else if (objectType === "Case") {
//             return CASE_FIELDS;
//         }

//         return [];
//     } catch (error) {
//         console.error(`Error describing ${objectType}:`, error);
//         throw error;
//     }
// }

// const createDocumentFromSalesforceRecord = async (DTO:
//     {
//         record: any,
//         objectType: string,
//         connector: Connector & { credentials_data: SalesforceConnectorCredentialsData }
//     }
// ) => {
//     const { record, objectType, connector } = DTO;

//     const link = `${connector.credentials_data.instance_url}/lightning/r/${objectType}/${record.Id}/view`;

//     const metadata = {
//         id: record.Id
//     }

//     let formatted_record = Object.fromEntries(Object.entries(record).filter(([_, value]) => value !== undefined));

//     const content = Object.entries(formatted_record).map(([key, value]) => `${key}: ${value}`).join(", ")

//     let title = ""

//     if (objectType === "Account") {
//         title = record.Name;
//     } else if (objectType === "Case") {
//         title = `${record.CaseNumber} ${record.Subject}`;
//     } else if (objectType === "Contact") {
//         title = `${record.Name} ${record.Phone} ${record.MobilePhone} ${record.Email}`;
//     } else if (objectType === "Lead") {
//         title = `${record.Name} ${record.Phone} ${record.MobilePhone} ${record.Email}`;
//     } else if (objectType === "Opportunity") {
//         title = record.Name;
//     }

//     const document = (await DB.insert(document_table).values({
//         fk_document_org: connector.fk_connector_org,
//         fk_document_connector: connector.id,
//         link,
//         metadata
//     }))

//     const chunks = await text_splitter.splitText(content);

//     await Promise.all(chunks.map(async (chunk, index) => {
//         await DB.insert(document_chunk_table).values({
//             fk_chunk_org: connector.fk_connector_org,
//             fk_chunk_connector: connector.id,
//             fk_chunk_document: document.id,
//             chunk_index: index
//         })

//         await VectorQueueService.addVectorEntity({
//             org_id: connector.fk_connector_org,
//             connector_id: connector.id,
//             document_id: document.id,
//             title,
//             chunk_content: chunk,
//             chunk_index: index
//         })
//     }))
// }

// const indexSalesforceObject = async (
//     objectType: string,
//     connector: Connector & { credentials_data: SalesforceConnectorCredentialsData }
// ) => {
//     const { instance_url, access_token } = connector.credentials_data;

//     const conn = createSalesforceConnection(instance_url, access_token);

//     const fields = describeSalesforceObject(objectType, conn);

//     if (!fields.length) {
//         console.warn(`No valid fields found for ${objectType}, skipping`);
//         return;
//     }

//     const soqlQuery = `SELECT ${fields.join(', ')} FROM ${objectType} LIMIT 500000`;

//     const record_stream = await conn.bulk2.query(soqlQuery);

//     record_stream.on("record", (data) => {
//         createDocumentFromSalesforceRecord({ record: data, objectType, connector })
//     })
// }

// export const initialIndexSalesforce = async (DTO: { connector_id: string, now_date: Date }) => {
//     const { connector_id, now_date } = DTO;

//     const connector: Connector & {
//         credentials_data: SalesforceConnectorCredentialsData
//     } = (await DB.select().from(connector_table).where(eq(connector_table.id, connector_id)))[0] as any;

//     if (!connector) {
//         throw new Error(`Connector with ${connector_id} not found`);
//     }

//     for (const objectType of DEFAULT_SALESFORCE_OBJECTS) {
//         try {
//             await indexSalesforceObject(objectType, connector);
//         } catch (error) {
//             console.log(`Failed to index ${objectType}:`, error);
//         }
//     }
// }

// export const reindexSalesforce = async (DTO: { connector_id: string, now_date: Date }) => {

// }