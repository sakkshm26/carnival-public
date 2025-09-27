import React, { useEffect, useState } from 'react'
import { MultiSelect } from '@/components/ui/multiselect'
import { Button } from '@/components/ui/button'
import { DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CustomToast from '../toast'
import { useApiClient } from '@/utils/axios'
import { AppType } from '@/constants'

const SlackDialog = ({ connectorData, onSuccess }: {
    connectorData: { user_access_token: string, state: string },
    onSuccess: () => void
}) => {
    const api_client = useApiClient();

    const [channels, setChannels] = useState<{ label: string, value: string }[]>([]);
    const [selectedChannels, setSelectedChannels] = useState<{ label: string, value: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [connectorName, setConnectorName] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const response = await api_client.get(`/internal/connector/slack-channels?user_access_token=${connectorData.user_access_token}`);
                setChannels(response.data.map((channel: any) => ({ label: channel.name, value: channel.id })));
            } catch (error) {
                console.error('Error fetching channels:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchChannels();
    }, []);

    const handleSave = async () => {
        setSubmitting(true);
        try {
            await api_client.post("/internal/connector", {
                connector_name: connectorName,
                app_type: AppType.SLACK,
                connector_data: {
                    user_access_token: connectorData.user_access_token,
                    channel_ids: selectedChannels.map(channel => channel.value)
                }
            })
            onSuccess();
        } catch (error) {
            CustomToast({ message: "Some error occurred" })
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div>Loading channels...</div>;
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Connect Slack</DialogTitle>
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
                        <Label className="text-base">Select Channels to Sync</Label>
                        <p className="text-sm text-muted-foreground">Choose the Slack channels you want to connect</p>
                    </div>
                    <MultiSelect
                        options={channels}
                        selectedValues={selectedChannels}
                        setSelectedValues={values => setSelectedChannels(values)}
                        placeholder="Select channels..."
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

export default SlackDialog 