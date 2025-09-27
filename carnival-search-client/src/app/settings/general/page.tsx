'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import dayjs from 'dayjs'
import CustomToast from '@/components/toast'
import { useApiClient } from '@/utils/axios'
import { Org } from '@/types/schema_types'
import Loader from '@/components/loader'

const Workspace = () => {
    const api_client = useApiClient();

    const [org, setOrg] = useState<Org | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newName, setNewName] = useState('');

    const getOrg = async () => {
        try {
            const response = await api_client.get('/internal/org')
            setOrg(response.data)
            setNewName(response.data.name)
        } catch (err) {
            CustomToast({ message: "Failed to get workspace details" })
        }
    }

    const handleUpdateName = async () => {
        try {
            await api_client.put('/internal/org', { name: newName })
            setOrg(prev => ({ ...prev!, name: newName }))
            setIsDialogOpen(false)
            CustomToast({ message: "Workspace updated successfully" })
        } catch (err) {
            CustomToast({ message: "Failed to update workspace" })
        }
    }

    useEffect(() => {
        getOrg()
    }, [])

    return (
        org ? (
            <div>
                <p className='p-4'>General</p>
                <hr />
                <div className="flex justify-center w-full px-4 py-6">
                    <div className='w-full max-w-[600px] rounded-3xl border'>
                        <div className='px-6 py-6'>
                            <div className='flex items-center space-x-5'>
                                <p className='text-lg'>{org.name}</p>
                            </div>
                            <div className="space-y-3 mt-8">
                                <div className='flex items-center space-x-2'>
                                    <h3 className="text-gray-500 w-32 text-sm">Name</h3>
                                    <div className="">
                                        <p className="text-sm">{org.name || '-'}</p>
                                    </div>
                                </div>
                                <div className='flex items-center space-x-2 pb-3'>
                                    <h3 className="text-gray-500 w-32 text-sm">Created At</h3>
                                    <p className="mt-1 text-sm">
                                        {dayjs(org.created_at).format('MMMM D, YYYY')}
                                    </p>
                                </div>
                                <Button onClick={() => setIsDialogOpen(true)} className='text-sm'>Edit</Button>
                            </div>
                        </div>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                            <DialogHeader>
                                <DialogTitle className='text-base font-medium'>Update Organization</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">
                                        Organization Name
                                    </label>
                                    <Input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Enter organization name"
                                        className=''
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    className='text-sm'
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleUpdateName} className='text-sm'>
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        ) : <Loader global={true} />
    )
}

export default Workspace