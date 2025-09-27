"use client";
import DashboardPanelsContext from "@/contexts/dashboard-panel-context";
import React, { useContext } from "react";

const Panels = () => {
    const { panels } = useContext(DashboardPanelsContext);

    return (
        <div className="flex absolute right-0 top-0 bottom-0 z-[20] bg-white">
            {panels?.map((Panel) => (
                React.cloneElement(Panel.component, {
                    key: Panel.panelId,
                    fullVisible: Panel.fullVisible,
                })
            ))}
        </div>
    );
};

export default Panels;
