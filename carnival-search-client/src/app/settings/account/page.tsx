'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import dayjs from 'dayjs'
import CustomToast from '@/components/toast'
import { useApiClient } from '@/utils/axios'
import { User } from '@/types/schema_types'
import Loader from '@/components/loader'
import Avatar from '@/components/elements/Avatar'

const Account = () => {
    const api_client = useApiClient();

    const [user, setUser] = useState<User | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<{ displayName: string | null }>({
        displayName: null
    })

    const getUser = async () => {
        try {
            const response = await api_client.get('/internal/user')
            setUser(response.data)
            setFormData({
                displayName: response.data.display_name
            })
        } catch (err) {
            CustomToast({ message: "Failed to get account details" })
        }
    }

    const handleUpdateName = async () => {
        try {
            await api_client.put('/internal/user', { display_name: formData.displayName })
            setUser(prev => ({ ...prev!, display_name: formData.displayName }))
            setIsDialogOpen(false)
            CustomToast({ message: "Account updated successfully" })
        } catch (err) {
            CustomToast({ message: "Failed to update account" })
        }
    }

    useEffect(() => {
        getUser()
    }, [])

    return (
        user ? (
            <div>
                <p className='p-4'>Account</p>
                <hr />
                <div className="flex justify-center w-full px-4 py-6">
                    <div className='w-full max-w-[600px] rounded-3xl border'>
                        <div className='px-6 py-6'>
                            <div className='flex items-center space-x-5'>
                                {user ? <Avatar name={user.display_name!} color_type={user.color} className='h-[55px] w-[55px] rounded-xl text-2xl' /> : <div className='w-10 h-10 rounded-full bg-gray-200'></div>}
                                <p className='text-lg'>{user.display_name}</p>
                            </div>
                            <div className="space-y-3 mt-8">
                                <div className='flex items-center space-x-2'>
                                    <h3 className="text-gray-500 w-32 text-sm">Name</h3>
                                    <div className="">
                                        <p className="text-sm">{user.display_name || '-'}</p>
                                    </div>
                                </div>
                                <div className='flex items-center space-x-2'>
                                    <h3 className="text-gray-500 w-32 text-sm">Email</h3>
                                    <div className="mt-1">
                                        <p className="text-sm">{user.email || '-'}</p>
                                    </div>
                                </div>
                                <div className='flex items-center space-x-2 pb-3'>
                                    <h3 className="text-gray-500 w-32 text-sm">Created At</h3>
                                    <p className="mt-1 text-sm">
                                        {dayjs(user.created_at).format('MMMM D, YYYY')}
                                    </p>
                                </div>
                                <Button onClick={() => setIsDialogOpen(true)} className='text-sm'>Edit</Button>
                            </div>
                        </div>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                            <DialogHeader>
                                <DialogTitle className='text-base font-medium'>Update Account</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-600">
                                        Account Name
                                    </label>
                                    <Input
                                        value={formData.displayName || undefined}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        placeholder="Enter account name"
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

export default Account