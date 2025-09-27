import { AppType } from '@/constants'
import React from 'react'
import Image from 'next/image'

const GetAppLogo = (props: { appType: AppType, width?: number, height?: number, type?: 'xs' | 'sm' | 'md' | 'lg' }) => {
    const logoMap: Record<AppType, {
        src: string
        alt: string
        xs_width: number
        xs_height: number
        width: number
        height: number
        className?: string
    }> = {
        [AppType.GOOGLE_DRIVE]: {
            src: '/app_logos/google_drive.svg',
            alt: 'Google Drive',
            xs_width: 16,
            xs_height: 16,
            width: 26,
            height: 26
        },
        [AppType.JIRA]: {
            src: '/app_logos/jira.svg',
            alt: 'Jira',
            xs_width: 17,
            xs_height: 17,
            width: 30,
            height: 30
        },
        [AppType.SLACK]: {
            src: '/app_logos/slack.svg',
            alt: 'Slack',
            xs_width: 13,
            xs_height: 13,
            width: 26,
            height: 26
        },
        [AppType.SALESFORCE]: {
            src: '/app_logos/salesforce.svg',
            alt: 'Salesforce',
            xs_width: 18,
            xs_height: 18,
            width: 40,
            height: 40
        },
        [AppType.CONFLUENCE]: {
            src: '/app_logos/confluence.svg',
            alt: 'Confluence',
            xs_width: 13,
            xs_height: 13,
            width: 22,
            height: 22
        },
        [AppType.GITHUB]: {
            src: '/app_logos/github.png',
            alt: 'Github',
            xs_width: 16,
            xs_height: 16,
            width: 26,
            height: 26,
            className: 'invert'
        },
        [AppType.GMAIL]: {
            src: '/app_logos/gmail.png',
            alt: 'Gmail',
            xs_width: 16,
            xs_height: 16,
            width: 26,
            height: 26
        },
        [AppType.HUBSPOT]: {
            src: '/app_logos/hubspot.svg',
            alt: 'HubSpot',
            xs_width: 16,
            xs_height: 16,
            width: 26,
            height: 26
        },
        [AppType.NOTION]: {
            src: '/app_logos/notion.svg',
            alt: 'Notion',
            xs_width: 16,
            xs_height: 16,
            width: 36,
            height: 36
        },
        [AppType.TEAMS]: {
            src: '/app_logos/teams.svg',
            alt: 'Teams',
            xs_width: 16,
            xs_height: 16,
            width: 26,
            height: 26
        },
        [AppType.ZENDESK]: {
            src: '/app_logos/zendesk.svg',
            alt: 'Zendesk',
            xs_width: 16,
            xs_height: 16,
            width: 26,
            height: 26
        },
        [AppType.DROPBOX]: {
            src: '/app_logos/dropbox.svg',
            alt: 'Dropbox',
            xs_width: 16,
            xs_height: 16,
            width: 36,
            height: 36
        },
        [AppType.GOOGLE_CALENDAR]: {
            src: '/app_logos/google_calendar.svg',
            alt: 'Google Calendar',
            xs_width: 16,
            xs_height: 16,
            width: 26,
            height: 26
        },
        [AppType.MONDAY]: {
            src: '/app_logos/monday.svg',
            alt: 'Monday',
            xs_width: 16,
            xs_height: 16,
            width: 26,
            height: 26
        },
        [AppType.LINEAR]: {
            src: '/app_logos/linear.svg',
            alt: 'Linear',
            xs_width: 16,
            xs_height: 16,
            width: 26,
            height: 26
        }
    }

    const logoProps = logoMap[props.appType]

    return (
        <Image
            src={logoProps.src}
            alt={logoProps.alt}
            width={props.width ?? (props.type ? (logoMap[props.appType] as any)[props.type + '_width'] : logoProps.width)}
            height={props.height ?? (props.type ? (logoMap[props.appType] as any)[props.type + '_height'] : logoProps.height)}
            className={logoProps.className}
        />
    )
}

export default GetAppLogo