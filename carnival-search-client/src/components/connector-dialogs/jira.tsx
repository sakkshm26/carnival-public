import React, { useEffect, useState } from 'react'
import { MultiSelect } from '@/components/ui/multiselect'
import { Button } from '@/components/ui/button'
import { DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CustomToast from '../toast'
import { useApiClient } from '@/utils/axios'
import { AppType } from '@/constants'

const JiraDialog = ({ connectorData, onSuccess }: {
    connectorData: { projects: {label: string, value: string}[], connectorName: string, access_token: string, email: string, base_url: string },
    onSuccess: () => void
}) => {
    const api_client = useApiClient();

    const [selectedProjects, setSelectedProjects] = useState<{ label: string, value: string }[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const handleSave = async () => {
        setSubmitting(true);
        try {
            await api_client.post("/internal/connector", {
                connector_name: connectorData.connectorName,
                app_type: AppType.JIRA,
                connector_data: {
                    project_ids: selectedProjects.map(project => project.value),
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
                <DialogTitle>Connect Jira</DialogTitle>
            </DialogHeader>
            <div className="">
                <div className="space-y-4 mt-8">
                    <div className="space-y-2">
                        <Label className="text-base">Select Projects to Sync</Label>
                        <p className="text-sm text-muted-foreground">Choose the Jira projects you want to connect</p>
                    </div>
                    <MultiSelect
                        options={connectorData.projects}
                        selectedValues={selectedProjects}
                        setSelectedValues={values => setSelectedProjects(values)}
                        placeholder="Select projects..."
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSave} disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
            </DialogFooter>
        </>
    )
}

export default JiraDialog 