"use client";
import { usePathname } from "next/navigation";
import {
    createContext,
    useState,
    ReactNode,
    useEffect,
    useRef,
    useCallback,
} from "react";

export enum PanelTypes {
    USER_VIEW = "user_view",
    USER_GROUP_VIEW = "user_group_view",
    CONNECTOR_VIEW = "connector_view"
}

interface DashboardPanelComponentType {
    fullVisible: boolean;
    component: React.JSX.Element;
    panelId: string;
    panelType: PanelTypes;
    closeAll?: boolean;
    callingFrom?: PanelTypes;
    panelFunctions?: Record<string, any>;
    onClose?: () => void;
}

const DashboardPanelsContext = createContext<{
    panels: DashboardPanelComponentType[] | null;
    addPanel: (param: DashboardPanelComponentType) => any;
    closePanel: (panelId: string) => any;
    triggerPanelFunction: (
        panelId: string,
        functionName: string,
        ...args: any
    ) => any;
    sidebarExpaned: boolean;
    setSidebarExpanded: (expanded: boolean) => any;
}>({
    panels: null,
    addPanel: () => {},
    closePanel: () => {},
    triggerPanelFunction: () => {},
    sidebarExpaned: true,
    setSidebarExpanded: () => {},
});

export const DashboardPanelsProvider = ({
    children,
}: {
    children: ReactNode;
}) => {
    const [sidebarExpaned, setSidebarExpanded] = useState(true);
    const [panels, setPanels] = useState<DashboardPanelComponentType[]>(
        []
    );
    const [windowWidth, setWindowWidth] = useState<number | null>(null);
    const panelFunctions = useRef<Record<string, any>>({});

    const pathname = usePathname();

    const triggerPanelFunction = useCallback(
        (panelId: string, functionName: string, ...args: any) => {
            if (panelFunctions.current[panelId]?.[functionName]) {
                panelFunctions.current[panelId][functionName](...args);
            }
        },
        []
    );

    useEffect(() => {
        setWindowWidth(window.innerWidth);
    }, []);

    useEffect(() => {
        closeAllPanels();
    }, [pathname]);

    const cleanPanels = (newPanel: DashboardPanelComponentType) => {
        let updatedPanels = panels;
        if (newPanel.closeAll) {
            updatedPanels = [];
        }
        return updatedPanels;
    };

    const addPanel = (panel: DashboardPanelComponentType) => {
        panelFunctions.current[panel.panelId] = panel.panelFunctions;
        if (windowWidth) {
            let updatedPanels = panels;
            updatedPanels = cleanPanels(panel);

            if (windowWidth < 1024) {
                setPanels([{ ...panel, fullVisible: false }]);
            } else if (windowWidth < 1536) {
                if (!updatedPanels.length) {
                    setPanels([panel]);
                } else if (updatedPanels.length === 1) {
                    updatedPanels = updatedPanels.map((panel) =>
                        panel.fullVisible
                            ? { ...panel, fullVisible: false }
                            : panel
                    );
                    setPanels((prev) => {
                        const newPanel = {
                            ...panel,
                            fullVisible: false,
                        };

                        return [newPanel, ...updatedPanels];
                    });
                } else {
                    setPanels((prev) => {
                        const newPanel = {
                            ...panel,
                            fullVisible: false,
                        };

                        return [newPanel, ...updatedPanels].slice(0, 2);
                    });
                }
            } else {
                if (!updatedPanels.length) {
                    setPanels([panel]);
                } else if (updatedPanels.length === 1) {
                    setPanels((prev) => {
                        const newPanel = {
                            ...panel,
                            fullVisible: false,
                        };

                        return [newPanel, ...updatedPanels];
                    });
                } else if (updatedPanels.length === 2) {
                    setPanels((prev) => {
                        const leftPanel = updatedPanels[0];
                        const rightPanel = updatedPanels[1];
                        if (rightPanel.fullVisible) {
                            rightPanel.fullVisible = false;
                        }
                        const newPanel = {
                            ...panel,
                            fullVisible: false,
                        };

                        return [newPanel, leftPanel, rightPanel];
                    });
                } else {
                    setPanels((prev) => {
                        const newPanel = {
                            ...panel,
                            fullVisible: false,
                        };

                        return [newPanel, ...updatedPanels].slice(0, 3);
                    });
                }
            }
        }
    };

    const closePanel = (panelId: string) => {
        const foundPanel = panels.find((panel) => panel.panelId === panelId);
        if (foundPanel?.onClose) {
            foundPanel.onClose();
        }
        setPanels((currentPanels) => {
            return currentPanels.filter((panel) => panel.panelId !== panelId);
        });
    };

    const closeAllPanels = () => {
        setPanels([]);
    };

    return (
        <DashboardPanelsContext.Provider
            value={{
                panels,
                addPanel,
                closePanel,
                triggerPanelFunction,
                sidebarExpaned,
                setSidebarExpanded,
            }}
        >
            {children}
        </DashboardPanelsContext.Provider>
    );
};

export default DashboardPanelsContext;
