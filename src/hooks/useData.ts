import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export const useOverview  = () => useQuery({ queryKey:['overview'],  queryFn: api.getOverview,  refetchInterval: 30_000, staleTime: 0 });
export const useAPs       = () => useQuery({ queryKey:['aps'],       queryFn: api.getAPs,       refetchInterval: 30_000, staleTime: 0 });
export const useSwitches  = () => useQuery({ queryKey:['switches'],  queryFn: api.getSwitches,  refetchInterval: 60_000, staleTime: 0 });
export const useGateways  = () => useQuery({ queryKey:['gateways'],  queryFn: api.getGateways,  refetchInterval: 60_000, staleTime: 0 });
export const useServers   = () => useQuery({ queryKey:['servers'],   queryFn: api.getServers,   refetchInterval: 30_000, staleTime: 0 });
export const useClients   = () => useQuery({ queryKey:['clients'],   queryFn: api.getClients,   refetchInterval: 60_000, staleTime: 0 });
export const useAlerts    = () => useQuery({ queryKey:['alerts'],    queryFn: api.getAlerts,    refetchInterval: 20_000, staleTime: 0 });
export const useBandwidth = () => useQuery({ queryKey:['bandwidth'], queryFn: api.getBandwidth, refetchInterval: 30_000, staleTime: 0 });
