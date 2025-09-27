import React, { useEffect, useState } from 'react'
import { MultiSelect } from '@/components/ui/multiselect'
import { Button } from '@/components/ui/button'
import { DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CustomToast from '../toast'
import { useApiClient } from '@/utils/axios'
import { AppType } from '@/constants'

const SalesforceDialog = ({ connectorData, onSuccess }: {
    connectorData: { access_token: string, refresh_token: string, instance_url: string },
    onSuccess: () => void
}) => {
    const api_client = useApiClient();

    const [connectorName, setConnectorName] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSave = async () => {
        setSubmitting(true);
        try {
            await api_client.post("/internal/connector", {
                connector_name: connectorName,
                app_type: AppType.SALESFORCE,
                connector_data: connectorData
            })
            onSuccess();
        } catch (error) {
            CustomToast({ message: "Some error occurred" })
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>Connect Salesforce</DialogTitle>
            </DialogHeader>
            <div className="">
                <div className="grid grid-cols-4 items-center gap-4 my-5">
                    <Label className="">
                        Connector Name
                    </Label>
                    <Input
                        name="connector_name"
                        type="text"
                        placeholder="Enter Connector Name"
                        className="col-span-3"
                        onChange={(e) => setConnectorName(e.target.value)}
                        required={false}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSave} disabled={submitting}>
                    {submitting ? "Saving..." : "Save"}
                </Button>
            </DialogFooter>
        </>
    )
}

export default SalesforceDialog 