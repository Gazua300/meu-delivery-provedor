import { useEffect, useMemo, useState } from "react"
import type { Order } from "../types/types"


const ALERT_DELAY_MS = 60_000


export const usePaidOrderAlerts = (orders:Order[]):Set<string>=>{
    const [now, setNow] = useState(() => Date.now())

    const candidates = useMemo(()=>{
        return orders.flatMap(order=>{
            const approvedAtValue = order.payment_approved_at
            if(
                order.state !== 'REQUESTED' ||
                order.payment_status !== 'APPROVED' ||
                !approvedAtValue
            ){
                return []
            }

            const approvedAt = approvedAtValue instanceof Date
                ? approvedAtValue.getTime()
                : Date.parse(approvedAtValue)

            if(!Number.isFinite(approvedAt)) return []

            return [{
                id: order.id,
                alertAt: approvedAt + ALERT_DELAY_MS
            }]
        })
    }, [orders])

    useEffect(()=>{
        const nextAlertAt = candidates.reduce(
            (next, candidate) =>
                candidate.alertAt > now
                    ? Math.min(next, candidate.alertAt)
                    : next,
            Number.POSITIVE_INFINITY
        )

        if(!Number.isFinite(nextAlertAt)) return

        const timeoutId = window.setTimeout(
            () => setNow(Date.now()),
            Math.max(0, nextAlertAt - Date.now())
        )

        return () => window.clearTimeout(timeoutId)
    }, [candidates, now])

    return useMemo(
        () => new Set(
            candidates
                .filter(candidate => candidate.alertAt <= now)
                .map(candidate => candidate.id)
        ),
        [candidates, now]
    )
}
