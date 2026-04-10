import { ApiService } from "@/shared/services/api.service";
import { DashboardStats } from "@/features/dashboard/types/dashboard.types";

export const DashboardService = {
    getMyStats: async (): Promise<DashboardStats> => {
        const res = await ApiService.get<DashboardStats>("/dashboard/me");
        return res.data;
    },

    getAgentStats: async (agentId: string): Promise<DashboardStats> => {
        const res = await ApiService.get<DashboardStats>(`/dashboard/agent/${agentId}`);
        return res.data;
    },
};
