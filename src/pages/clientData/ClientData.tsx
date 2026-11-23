import { type FC, useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdFeed } from "react-icons/md"
import axios from 'axios'
import { Container } from './styled'
import Header from "../../components/Header"
import type { Order, User } from '../../types/types'
import { useGlobal } from '../../hooks/useGlobal'
import { ProviderRoutes } from '../../routes/paths'
import { formatPhoneNumber } from '../../utils/inputsAndKeys'
import { usePaidOrderAlerts } from '../../hooks/usePaidOrderAlerts'



const BASE_URL = import.meta.env.VITE_BASE_URL


const getClientOrderStatusLabel = (order:Order):string=>{
    if(order.state === 'REQUESTED'){
        return order.payment_status === 'APPROVED'
            ? 'Pago — aguardando entrega'
            : 'Aguardando pagamento'
    }

    if(order.state === 'FINISHED') return 'Concluído'
    if(order.state === 'EXPIRED') return 'Expirado'
    return order.state
}


const ClientData:FC = ()=>{
    const navigate = useNavigate()
    const { providerToken } = useGlobal()
    const userId = localStorage.getItem('userId')
    const [user, setUser] = useState<User | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const blinkingOrderIds = usePaidOrderAlerts(orders)
    const [isUiLoading, setIsUiLoading] = useState<boolean>(true)
    const [isMutating, setIsMutating] = useState<boolean>(false)

    
    // 🛡️ Memoized authorization headers to safeguard dependency cycles
    const requestConfig = useMemo(() => ({
        headers: { Authorization: providerToken || '' }
    }), [providerToken])


    const fetchClientWorkspace = useCallback(async()=>{
        if(!userId){
            console.error("Identificação válida do cliente não encontrada.")
            navigate(ProviderRoutes.ORDERS)
            return null
        }

        try{
            const [profileRes, historyRes] = await Promise.all([
                axios.get<User>(`${BASE_URL}/users/profile/${userId}`, requestConfig),
                axios.get<Order[]>(`${BASE_URL}/orders/user/${userId}`, requestConfig)
            ]);

            return { user: profileRes.data, orders: historyRes.data }
        }catch(error:unknown){
            console.error('Não foi possível carregar os dados do cliente:', error)
            return null
        }
    }, [userId, requestConfig, navigate])



    useEffect(() => {
        let cancelled = false
        const loadClientWorkspace = () => {
            void fetchClientWorkspace().then(workspace => {
                if(cancelled) return
                if(workspace){
                    setUser(workspace.user)
                    setOrders(workspace.orders)
                }
                setIsUiLoading(false)
            })
        }

        loadClientWorkspace()

        const refreshInterval = window.setInterval(
            loadClientWorkspace,
            10_000
        )

        return () => {
            cancelled = true
            window.clearInterval(refreshInterval)
        }
    }, [fetchClientWorkspace])


    const handleUpdateOrderStatus = async(orderId:string, targetState:'finish' | 'return')=>{
        if(isMutating) return

        const endpointPath = targetState === 'finish'
        ? `${BASE_URL}/orders/${orderId}/finish`
        : `${BASE_URL}/orders/${orderId}/revert`

        try{
            setIsMutating(true)
            await axios.patch(endpointPath, {}, requestConfig)

            const refreshOrders = await axios.get<Order[]>(`${BASE_URL}/orders/user/${userId}`, requestConfig)
            setOrders(refreshOrders.data)
        }catch(error:unknown){
            console.error('Não foi possível atualizar o status do pedido:', error)
        }finally{
            setIsMutating(false)
        }
    }


    const totalPendentes = useMemo(() => {
        return orders
            .filter(order => order.state === 'REQUESTED')
            .reduce(
                (sum, order) => sum + Number(order.price) * Number(order.quantity),
                0
            )
    }, [orders])

    const totalConcluidos = useMemo(() => {
        return orders
            .filter(order => order.state === 'FINISHED')
            .reduce(
                (sum, order) => sum + Number(order.price) * Number(order.quantity),
                0
            )
    }, [orders])

    const totalGeral = useMemo(()=>{
        return orders.reduce(
            (sum, order) => sum + Number(order.price) * Number(order.quantity),
            0
        )
    }, [orders])


    if (isUiLoading) {
        return <div style={{ textAlign: 'center', marginTop: '20vh' }}>Carregando os dados do cliente...</div>;
    }



    return(
        <>
            <Header
                rightIcon={<div />}
                leftIcon={
                <MdFeed 
                    className="header-icon" 
                    onClick={() => navigate(ProviderRoutes.ORDERS)}
                    style={{ cursor: 'pointer' }}
                />
                }
            />        
            
            <Container>    
                <h1 style={{textAlign:'center'}}>Perfil do Cliente</h1>            
                <hr style={{ width: '100%', marginBottom: '15px', backgroundColor: '#e2e8f0', border: 'none', height: '1px' }} />
                
                {user && (
                <>
                    <div className="user-section">
                    <div style={{lineHeight:'30px'}}>
                        <strong>{user.username}</strong>
                        <div style={{ color: '#64748b' }}>{user.email}</div>
                        <div style={{ color: '#64748b' }}>{formatPhoneNumber(user.phone)}</div>
                    </div>
                    </div>

                    <div className="address-section">
                        <div style={{lineHeight:'30px'}}>
                            <strong>Endereço:</strong> <br />
                            {user.street}, Nº {user.number}
                            {user.complement && ` (${user.complement})`} <br />
                            {user.neighbourhood}, {user.city} - {user.state}
                        </div>
                    </div>
                </>
                )}

                <div className="addressAndName">
                <div className="rest-name"></div>
                <div></div>
                </div>

                <div className='sticky-title'>
                        <div id="history" className="order-history">
                            Pedidos ativos de {user?.username}
                        </div>
                        <strong>Pendentes:</strong> R$ {totalPendentes.toFixed(2)}{ ' | '}
                        <strong>Concluídos:</strong> R$ {totalConcluidos.toFixed(2)}{ ' | '}
                        <strong>Total Geral:</strong> R$ {totalGeral.toFixed(2)}
                        
                    </div>
                    <hr style={{ width: '100%', marginBottom: '15px', backgroundColor: '#e2e8f0', border: 'none', height: '1px' }} />
                
                {orders.length === 0 && (
                <div style={{ color: '#64748b', padding: '1rem 0' }}>Este cliente não tem pedidos ativos.</div>
                )}

                <div className="card-container">
                {orders.map(order => (
                    <div className={`card${blinkingOrderIds.has(order.id) ? ' card--paid-overdue' : ''}`} key={order.id}>
                        <div className="card-content">
                            <div className="rest-name">
                            {order.product} — R$ {Number(order.price).toFixed(2)}
                            </div>
                            <b>Pedido feito em:</b> {new Date(order.moment).toLocaleString()} <br/>
                            <b>Quantidade:</b> {order.quantity}<br/>
                            <b>Total:</b> R$ {Number(order.total).toFixed(2)}<br/>
                                <b>Status:</b> {getClientOrderStatusLabel(order)} <br />

                            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            {order.state === 'REQUESTED' ? (
                                <button 
                                    disabled={isMutating || order.payment_status !== 'APPROVED'}
                                onClick={() => handleUpdateOrderStatus(order.id, 'finish')}
                                >
                                    {isMutating
                                        ? 'Atualizando...'
                                        : order.payment_status === 'APPROVED'
                                        ? 'Finalizar pedido'
                                        : 'Aguardando pagamento'
                                    }
                                </button>
                                ) : order.state === 'FINISHED' ? (
                                <button 
                                disabled={isMutating}
                                onClick={() => handleUpdateOrderStatus(order.id, 'return')}
                                style={{ backgroundColor: '#475569' }} // Darker slate override for reversing actions
                                >
                                {isMutating ? 'Atualizando...' : 'Voltar para pendente'}
                                </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            </Container>
        </>
    )
}


export default ClientData