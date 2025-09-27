import React, { useEffect, useState } from 'react'
import { MultiSelect } from '@/components/ui/multiselect'
import { Button } from '@/components/ui/button'
import { DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CustomToast from '../toast'
import { useApiClient } from '@/utils/axios'
import { AppType } from '@/constants'

const ConfluenceDialog = ({ connectorData, onSuccess }: {
    connectorData: { spaces: {label: string, value: string}[], connectorName: string, access_token: string, email: string, base_url: string },
    onSuccess: () => void
}) => {
    const api_client = useApiClient();

    const [selectedSpaces, setSelectedSpaces] = useState<{ label: string, value: string }[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const handleSave = async () => {
        setSubmitting(true);
        try {
            await api_client.post("/internal/connector", {
                connector_name: connectorData.connectorName,
                app_type: AppType.CONFLUENCE,
                connector_data: {
                    space_keys: selectedSpaces.map(space => space.value),
                    access_token: connectorData.access_token,
                    email: connectorData.email,
                    base_url: connectorData.base_url
                }
            })
            onSuccess();
        } catch (error) {
            CustomToast({ message: "Some error occurred" })
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>Connect Confluence</DialogTitle>
            </DialogHeader>
            <div className="">
                <div className="space-y-4 mt-8">
                    <div className="space-y-2">
                        <Label className="text-base">Select Spaces to Sync</Label>
                        <p className="text-sm text-muted-foreground">Choose the Confluence spaces you want to connect</p>
                    </div>
                    <MultiSelect
                        options={connectorData.spaces}
                        selectedValues={selectedSpaces}
                        setSelectedValues={values => setSelectedSpaces(values)}
                        placeholder="Select spaces..."
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSave} disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
            </DialogFooter>
        </>
    )
}

export default ConfluenceDialog 