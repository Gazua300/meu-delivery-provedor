import axios from 'axios'


const BASE_URL = import.meta.env.VITE_BASE_URL

export interface ProviderNotifications{
    id:string
    notification:string
    is_read:boolean
    created_at:string
}


let notificationPollingInterval: ReturnType<typeof setInterval> | null = null
let previousUnreadNotificationIds = new Set<string>()
let notificationAudioContext: AudioContext | null = null

async function playNotificationSound():Promise<void>{
    try{
        if(!notificationAudioContext){
            notificationAudioContext = new AudioContext()
        }

        if(notificationAudioContext.state === 'suspended'){
            await notificationAudioContext.resume()
        }

        const oscillator = notificationAudioContext.createOscillator()
        const gain = notificationAudioContext.createGain()
        const startedAt = notificationAudioContext.currentTime

        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(880, startedAt)
        oscillator.frequency.setValueAtTime(660, startedAt + 0.12)
        gain.gain.setValueAtTime(0.0001, startedAt)
        gain.gain.exponentialRampToValueAtTime(0.18, startedAt + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.4)

        oscillator.connect(gain)
        gain.connect(notificationAudioContext.destination)
        oscillator.start(startedAt)
        oscillator.stop(startedAt + 0.42)
    }catch(error){
        console.warn('Não foi possível reproduzir o som de notificação.', error)
    }
}



export const notifificationService = {
    getNofifications: async():Promise<ProviderNotifications[]>=>{
        const response = await axios.get<ProviderNotifications[]>(`${BASE_URL}/provider-notifications`, {
            headers: { Authorization: localStorage.getItem('@MyDeliveryProvider:token') }
        })
        return response.data
    },

    enableNotificationSound: async():Promise<void>=>{
        if(!notificationAudioContext){
            notificationAudioContext = new AudioContext()
        }

        if(notificationAudioContext.state === 'suspended'){
            await notificationAudioContext.resume()
        }
    },

    startNotificationStream: (
        onNotification:(notification:ProviderNotifications)=>void,
        onNotifications:(notifications:ProviderNotifications[])=>void,
        onError:(error:any)=>void
    ): (()=>void)=>{
        const abortController = new AbortController()
        let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
        let stopped = false

        async function reconcileNotifications(){
            try{
                const notifications = await notifificationService.getNofifications()
                onNotifications(notifications)
            }catch(error){
                onError(error)
            }
        }

        async function connect(){
            try{
                const token = localStorage.getItem('@MyDeliveryProvider:token')
                const response = await fetch(`${BASE_URL}/provider-notifications/events`, {
                    headers: { Authorization: token ?? '' },
                    signal: abortController.signal
                })

                if(!response.ok || !response.body){
                    throw new Error(`SSE connection failed: ${response.status}`)
                }

                await reconcileNotifications()
                const reader = response.body.getReader()
                const decoder = new TextDecoder()
                let buffer = ''

                while(!stopped){
                    const { value, done } = await reader.read()
                    if(done) break

                    buffer += decoder.decode(value, { stream: true })
                    const blocks = buffer.split('\n\n')
                    buffer = blocks.pop() ?? ''

                    for(const block of blocks){
                        const dataLine = block
                            .split('\n')
                            .find(line => line.startsWith('data:'))

                        if(!dataLine) continue

                        try{
                            const notification = JSON.parse(dataLine.slice(5).trim()) as ProviderNotifications
                            onNotification(notification)
                            await playNotificationSound()
                        }catch(error){
                            onError(error)
                        }
                    }
                }
            }catch(error){
                if(!stopped){
                    onError(error)
                    reconnectTimeout = setTimeout(() => {
                        void connect()
                    }, 3000)
                }
            }
        }

        void reconcileNotifications()
        void connect()

        return () => {
            stopped = true
            abortController.abort()
            if(reconnectTimeout){
                clearTimeout(reconnectTimeout)
            }
        }
    },

    startNotificationPolling: (
        onNotifications:(notifications:ProviderNotifications[])=>void,
        onError:(error:any)=>void,
        intervalMs:number = 30000
    ):(()=>void)=>{
        if(notificationPollingInterval){
            clearInterval(notificationPollingInterval)
        }

        let firstCheck = true

        async function checkNotifications(){
            try{
                const notifications = await notifificationService.getNofifications()
                const currentUnreadIds = new Set(
                    notifications
                        .filter(notification => !notification.is_read)
                        .map(notification => notification.id)
                )

                if(!firstCheck){
                    const hasNewUnreadNotification = [...currentUnreadIds].some(
                        id => !previousUnreadNotificationIds.has(id)
                    )

                    if(hasNewUnreadNotification){
                        await playNotificationSound()
                    }
                }

                previousUnreadNotificationIds = currentUnreadIds
                firstCheck = false
                onNotifications(notifications)
            }catch(error){
                onError(error)
            }
        }

        void checkNotifications()
        notificationPollingInterval = setInterval(checkNotifications, intervalMs)

        return () => {
            if(notificationPollingInterval){
                clearInterval(notificationPollingInterval)
                notificationPollingInterval = null
            }
        }
    },

    updateNotification: async(id:string):Promise<void>=>{
        const response = await axios.put(`${BASE_URL}/provider-notifications/update/${id}`, {}, {
            headers: { Authorization: localStorage.getItem('@MyDeliveryProvider:token') }
        })
        return response.data
    },

    updateAllNotifications: async():Promise<void>=>{
        const response = await axios.put(`${BASE_URL}/provider-notifications/update/all`, {}, {
            headers: { Authorization: localStorage.getItem('@MyDeliveryProvider:token') }
        })
        return response.data
    }
}