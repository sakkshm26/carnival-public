import React, { useEffect, useState } from 'react'
import { MultiSelect } from '@/components/ui/multiselect'
import { useApiClient } from '@/utils/axios'
import { Button } from '@/components/ui/button'
import { DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CustomToast from '../toast'
import { AppType } from '@/constants'

const GoogleDriveDialog = ({ connectorData, onSuccess }: {
    connectorData: { access_token: string, refresh_token: string, state: string },
    onSuccess: () => void
}) => {
    const api_client = useApiClient();
    
    const [folders, setFolders] = useState<{ label: string, value: string }[]>([]);
    const [selectedFolders, setSelectedFolders] = useState<{ label: string, value: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [connectorName, setConnectorName] = useState("");

    useEffect(() => {
        const fetchFolders = async () => {
            try {
                const response = await api_client.get(`/internal/connector/google-drive-folders?access_token=${connectorData.access_token}`);
                setFolders(response.data.map((folder: any) => ({ label: folder.name, value: folder.id })));
            } catch (error) {
                console.error('Error fetching folders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFolders();
    }, []);

    const handleSave = async () => {
        try {
            api_client.post("/internal/connector", {
                connector_name: connectorName,
                app_type: AppType.GOOGLE_DRIVE,
                connector_data: {
                    access_token: connectorData.access_token,
                    refresh_token: connectorData.refresh_token,
                    folder_ids: selectedFolders.map(folder => folder.value)
                },
            })
            onSuccess();
        } catch (error) {
            CustomToast({ message: "Some error occurred" })
        }
    };

    if (loading) {
        return <div>Loading folders...</div>;
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Connect Google Drive</DialogTitle>
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
                <div className="space-y-4 mt-8">
                    <div className="space-y-2">
                        <Label className="text-base">Select Folders to Sync</Label>
                        <p className="text-sm text-muted-foreground">Choose the Google Drive folders you want to connect</p>
                    </div>
                    <MultiSelect
                        options={folders}
                        selectedValues={selectedFolders}
                        setSelectedValues={values => setSelectedFolders(values)}
                        placeholder="Select folders..."
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
        </>
    )
}

export default GoogleDriveDialog