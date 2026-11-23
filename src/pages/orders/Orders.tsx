import { useEffect, useState, useMemo, useCallback, type FC } from "react"
import { useNavigate } from "react-router-dom"
import { IoMdHome } from "react-icons/io"
import axios from "axios"
import Header from "../../components/Header"
import { useGlobal } from "../../hooks/useGlobal"
import { usePaidOrderAlerts } from "../../hooks/usePaidOrderAlerts"
import { ProviderRoutes } from "../../routes/paths"
import type { Order, GroupedProducts } from "../../types/types"
import { Container } from "./styled"


const BASE_URL = import.meta.env.VITE_BASE_URL


const getOrderStateLabel = (state:string):string=>{
    if(state === 'REQUESTED') return 'Pendentes'
    if(state === 'FINISHED') return 'Concluídos'
    if(state === 'EXPIRED') return 'Expirados'
    return state
}


const getOrderStatusLabel = (order:Order):string=>{
    if(order.state === 'REQUESTED' && order.payment_status === 'APPROVED'){
        return 'Pago — aguardando entrega'
    }
    if(order.state === 'REQUESTED') return 'Aguardando pagamento'
    return getOrderStateLabel(order.state)
}


const getArchivedPaymentStatusLabel = (status?:string | null):string=>{
    switch(status){
        case 'APPROVED': return 'Aprovado'
        case 'REJECTED': return 'Recusado'
        case 'CANCELLED': return 'Cancelado'
        case 'EXPIRED': return 'Expirado'
        case 'PENDING': return 'Pendente'
        default: return 'Sem pagamento vinculado'
    }
}


const Orders:FC = ()=>{
    const navigate = useNavigate()
    const { providerToken, getProfile, user } = useGlobal()
    const [orders, setOrders] = useState<Order[]>([])
    const [archivedOrders, setArchivedOrders] = useState<Order[]>([])
    const [archivedSearch, setArchivedSearch] = useState<string>('')
    const [openState, setOpenState] = useState<string | null>(null)
    const [isUiLoading, setIsUiLoading] = useState<boolean>(true)
    const blinkingOrderIds = usePaidOrderAlerts(orders)

    const requestConfig = useMemo(()=>({
        headers: { Authorization: providerToken || '' }
    }), [providerToken])

    const fetchDashboardData = useCallback(async(loadProfile = false)=>{
        if(loadProfile) void getProfile()

        try{
            const [ordersResult, archivedResult] = await Promise.allSettled([
                axios.get<Order[]>(`${BASE_URL}/orders/all`, requestConfig),
                axios.get<Order[]>(`${BASE_URL}/orders/archived`, requestConfig)
            ])

            let activeOrdersData:Order[] | undefined
            let archivedOrdersData:Order[] | undefined

            if(ordersResult.status === 'fulfilled'){
                activeOrdersData = ordersResult.value.data
                setOrders(activeOrdersData)
            }else if(axios.isAxiosError(ordersResult.reason) && ordersResult.reason.response?.status === 404){
                activeOrdersData = []
                setOrders([])
            }else{
                console.error('Não foi possível carregar os pedidos ativos:', ordersResult.reason)
            }

            if(archivedResult.status === 'fulfilled'){
                archivedOrdersData = archivedResult.value.data
                setArchivedOrders(archivedOrdersData)
            }else if(axios.isAxiosError(archivedResult.reason) && archivedResult.reason.response?.status === 404){
                archivedOrdersData = []
                setArchivedOrders([])
            }else{
                console.error('Não foi possível carregar os pedidos arquivados:', archivedResult.reason)
            }

            setOpenState(current =>
                current ??
                activeOrdersData?.[0]?.state ??
                (archivedOrdersData?.length ? 'ARCHIVED' : null)
            )
        }finally{
            setIsUiLoading(false)
        }
    }, [requestConfig, getProfile])

    useEffect(()=>{
        void fetchDashboardData(true)
        const refreshInterval = window.setInterval(
            () => void fetchDashboardData(),
            10_000
        )
        return () => window.clearInterval(refreshInterval)
    }, [fetchDashboardData])

    const handleArchiveOrder = async(order:Order)=>{
        const description = order.state === 'EXPIRED'
            ? `Arquivar o pedido expirado "${order.product}"? Ele deixará de aparecer nas listas do fornecedor.`
            : `Arquivar o pedido concluído "${order.product}"? Ele deixará de aparecer nas listas do fornecedor.`
        if(!window.confirm(description)) return

        try{
            await axios.delete(`${BASE_URL}/orders/${order.id}`, requestConfig)
            await fetchDashboardData()
        }catch(error:unknown){
            console.error('Não foi possível arquivar o pedido:', error)
        }
    }

    const groupedOrders = useMemo(()=>{
        const grouped = orders.reduce((acc, order)=>{
            if(!acc[order.state]){
                acc[order.state] = { state: order.state, items: [], total: 0 }
            }
            acc[order.state].items.push(order)
            acc[order.state].total += Number(order.price) * Number(order.quantity)
            return acc
        }, {} as Record<string, GroupedProducts>)
        return Object.values(grouped)
    }, [orders])

    const activeGroup = useMemo(()=>{
        if(openState === 'ARCHIVED'){
            return {
                state: 'ARCHIVED',
                items: archivedOrders,
                total: archivedOrders.reduce(
                    (sum, order) => sum + Number(order.price) * Number(order.quantity),
                    0
                )
            }
        }
        return groupedOrders.find(group => group.state === openState) || null
    }, [groupedOrders, openState, archivedOrders])

    const displayedOrders = useMemo(()=>{
        if(!activeGroup) return []
        const query = archivedSearch.trim().toLocaleLowerCase()
        if(openState !== 'ARCHIVED' || !query) return activeGroup.items

        return activeGroup.items.filter(order=>{
            const values = [
                order.client,
                order.product,
                order.state,
                order.payment_status,
                getArchivedPaymentStatusLabel(order.payment_status),
                new Date(order.moment).toLocaleDateString('pt-BR'),
                order.archived_at
                    ? new Date(order.archived_at).toLocaleDateString('pt-BR')
                    : ''
            ]
            return values.some(value =>
                String(value ?? '').toLocaleLowerCase().includes(query)
            )
        })
    }, [activeGroup, archivedSearch, openState])

    if(isUiLoading){
        return <div style={{ textAlign: 'center', marginTop: '20vh' }}>Atualizando pedidos...</div>
    }

    return(
        <>
            <Header
                rightIcon={
                    <IoMdHome
                        className="header-icon"
                        onClick={() => navigate(ProviderRoutes.HOME)}
                        style={{ cursor: 'pointer' }}
                    />
                }
                leftIcon={<div />}
            />

            <Container>
                <h1>{user?.name || 'Carregando estabelecimento...'}</h1>
                <hr style={{ width: '100%', marginBottom: '15px', background: 'lightgray', border: 'none', height: '1px' }} />

                <div style={{textAlign:'center'}}>
                    <div id="history" className="order-history">Lista de pedidos</div>
                    <br />
                    <small>
                        Selecione Pendentes, Concluídos, Expirados ou Arquivados para
                        visualizar os pedidos correspondentes.
                    </small>
                </div>

                <div className="categories-bar">
                    {groupedOrders.map(group => (
                        <h3
                            title={`Clique para ver os pedidos ${getOrderStateLabel(group.state).toLowerCase()}`}
                            key={group.state}
                            onClick={() => setOpenState(group.state)}
                            style={{
                                color: openState === group.state ? 'red' : 'black',
                                cursor: 'pointer',
                                margin: '0 15px'
                            }}
                        >
                            {getOrderStateLabel(group.state)}
                        </h3>
                    ))}
                    <h3
                        title="Clique para ver os pedidos arquivados"
                        onClick={() => setOpenState('ARCHIVED')}
                        style={{
                            color: openState === 'ARCHIVED' ? 'red' : 'black',
                            cursor: 'pointer',
                            margin: '0 15px'
                        }}
                    >
                        Arquivados
                    </h3>
                </div>
                <hr style={{ width: '100%', marginBottom: '15px', background: 'lightgray', border: 'none', height: '1px' }} />

                <div className="card-container">
                    {activeGroup ? (
                        <>
                            {openState === 'ARCHIVED' ? (
                                <input
                                    className="archive-search"
                                    type="search"
                                    value={archivedSearch}
                                    onChange={event => setArchivedSearch(event.target.value)}
                                    placeholder="Buscar por produto, status do pagamento ou data"
                                    aria-label="Buscar pedidos arquivados"
                                />
                            ) : (
                                <h3 className="total-title">
                                    Valor total R$ {activeGroup.total.toFixed(2)}
                                </h3>
                            )}

                            {displayedOrders.map(order=>(
                                <div
                                    className={`card${blinkingOrderIds.has(order.id) ? ' card--paid-overdue' : ''}`}
                                    key={order.id}
                                >
                                    <div className="card-content">
                                        <div className="rest-name">{order.product}</div>
                                        R$ {Number(order.price).toFixed(2)} <br />
                                        <b>Pedido feito em:</b> {new Date(order.moment).toLocaleString()} <br />
                                        <b>Quantidade:</b> {order.quantity} <br />
                                        <b>Total:</b> R$ {Number(order.total).toFixed(2)} <br />
                                        <b>Endereço:</b> {order.address} <br />
                                        <b>Status:</b> {
                                            openState === 'ARCHIVED'
                                                ? getArchivedPaymentStatusLabel(order.payment_status)
                                                : getOrderStatusLabel(order)
                                        } <br />
                                        {order.state === 'FINISHED' && order.paymentmethod && (
                                            <><b>Forma de pagamento:</b> {order.paymentmethod}</>
                                        )}
                                    </div>
                                    <div className="btn-container">
                                        <button
                                            title="Ver os dados e os pedidos deste cliente"
                                            onClick={()=>{
                                                localStorage.setItem('userId', order.client)
                                                navigate(ProviderRoutes.CLIENT_DATA)
                                            }}
                                            className="check-client-btn"
                                        >
                                            Ver cliente
                                        </button>
                                        {openState !== 'ARCHIVED' &&
                                            (order.state === 'FINISHED' || order.state === 'EXPIRED') && (
                                                <button
                                                    className="remove-btn"
                                                    onClick={() => handleArchiveOrder(order)}
                                                >
                                                    Arquivar
                                                </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {displayedOrders.length === 0 && (
                                <div>
                                    {openState === 'ARCHIVED' && archivedSearch.trim()
                                        ? 'Nenhum pedido arquivado corresponde à busca'
                                        : openState === 'ARCHIVED'
                                        ? 'Nenhum pedido arquivado'
                                        : 'Nenhum pedido registrado'}
                                </div>
                            )}
                        </>
                    ) : (
                        openState === 'ARCHIVED'
                            ? <div>Nenhum pedido arquivado</div>
                            : <div>Nenhum pedido ativo registrado</div>
                    )}
                </div>
            </Container>
        </>
    )
}


export default Orders
