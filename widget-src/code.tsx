/* eslint-disable @typescript-eslint/no-explicit-any */
// This is a counter widget with buttons to increment and decrement the number.
import { connnected } from "./plug-connected";
import { disconnected } from "./plug-disconneced";

const { widget } = figma;
const { useSyncedState, SVG, AutoLayout, Text, useEffect } = widget;

const pluginData = figma.root.getSharedPluginDataKeys("audit");

function Widget() {
  const frameName = "Connect to node";
  const [keys, setKeys] = useSyncedState<string[]>("keys", pluginData);
  const [isConnected, setIsConnected] = useSyncedState("isConnected", false);
  const [connectedNodeId, setConnectedNodeId] = useSyncedState(
    "connectedNode",
    ""
  );
  const [connectedNodeName, setConnectedNodeName] = useSyncedState(
    "connectedNodeName",
    ""
  );

  const [connectedNodeChildren, setConnectedNodeChildren] = useSyncedState<
    string[]
  >("connectedNodeChildren", []);

  const keyList = buildKeyList(keys);

  const AcceptedNodeTypes = [
    "COMPONENT",
    "COMPONENT_SET",
    "INSTANCE",
    "FRAME",
    "GROUP",
  ];

  const SUCCESS_COLOR = {
    r: 0.12589435279369354,
    g: 0.9334961175918579,
    b: 0.179734468460083,
  };

  async function markReportDone(nodeId: string, key: string) {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node || !isAcceptedNodeType(node) || node.children.length === 0)
      return;

    node.children.forEach((element) => {
      if (element.name.includes(key)) {
        if (!isAcceptedNodeType(element)) return;
        element.strokes = [
          {
            type: "SOLID",
            visible: true,
            opacity: 1,
            blendMode: "NORMAL",
            color: SUCCESS_COLOR,
            boundVariables: {},
          },
        ];
        element.strokeWeight = 4;
      }
    });
  }
  function isAcceptedNodeType(
    node: BaseNode
  ): node is FrameNode | ComponentNode | InstanceNode {
    return AcceptedNodeTypes.includes(node.type);
  }

  function connectNode() {
    if (!isConnected) {
      const selection = figma.currentPage.selection;
      if (!selection.length) {
        figma.notify("Please select a node", { error: true });
        return;
      }
      if (selection.length > 1) {
        figma.notify("Please select only one node", { error: true });
        return;
      }
      if (!AcceptedNodeTypes.includes(selection[0].type)) {
        console.log("🦊");
        figma.notify("Please select a node", { error: true });
        return;
      }
      const selectedNode = selection[0];
      // const releaseNotesData = selectedNode.getPluginData("releaseNotes");
      // if (releaseNotesData) {
      //   const parsedData = JSON.parse(releaseNotesData);
      //   setReliseData(parsedData);
      //   setCurrentVersion(1);
      // }
      setConnectedNodeId(selectedNode.id);
      setConnectedNodeName(selectedNode.name);
      setIsConnected(true);
      if (AcceptedNodeTypes.includes(selectedNode.type)) {
        if (selectedNode.children) {
          selectedNode.children.forEach((child: any) => {
            const name = child.name;
            console.log("name>>>>>>>>>>>>>>>>>>>", name);
            if (!name.startsWith("re-")) return;
            setConnectedNodeChildren((prev) => [...prev, name.slice(3)]);
          });
        }
      }
    } else {
      setConnectedNodeId("");
      setConnectedNodeName(frameName);
      setIsConnected(false);
      setConnectedNodeChildren([]);
    }
  }

  function buildKeyList(
    pluginDataKeys: string[]
  ): FigmaDeclarativeNode | FigmaDeclarativeNode[] {
    return pluginDataKeys.map((element, index) => {
      return (
        <AutoLayout verticalAlignItems="center">
          <Text
            key={index}
            onClick={() => markReportDone(connectedNodeId, element)}
          >
            {element}
          </Text>
        </AutoLayout>
      );
    });
  }

  function filterKeyList(keys: string[], connectedNodeId: string) {
    if (!connectedNodeId) return;

    //     const node = await figma.getNodeByIdAsync(connectedNodeId);
    //     if (!node) return;
    //     if (!isAcceptedNodeType(node)) return;
    //     console.log("filtering");
    //
    //     const frames = node.children;
    //
    //     for (const frame of frames) {
    //       const name = frame.name.slice(3);
    //       const foundKey = keys.find((key) => key.includes(name));
    //       if (foundKey) {
    //         setFilteredList((prev) => [...prev, foundKey]);
    //       }
    //     }
    //
    //     const filteredKeyList = buildKeyList(filteredList);
    //     setFilteredKeyList(filteredKeyList);
  }

  return (
    <AutoLayout
      direction="vertical"
      verticalAlignItems={"center"}
      spacing={8}
      padding={16}
      cornerRadius={8}
      fill={"#FFFFFF"}
      stroke={"#E6E6E6"}
    >
      <AutoLayout
        name="release notes-section-title"
        overflow="visible"
        spacing={4}
        width="hug-contents"
        verticalAlignItems="center"
      >
        <Text
          name="Title"
          fill="#000"
          fontFamily="Inter"
          fontSize={32}
          fontWeight={700}
        >
          {connectedNodeName ? connectedNodeName : frameName}
        </Text>
        <SVG
          name="link"
          height={28}
          width={28}
          tooltip="Connect to component"
          src={isConnected ? connnected : disconnected}
          // src={isConnected ? linkConnectedVector : linkVector}
          onClick={async () => {
            connectNode();
            await filterKeyList(pluginData, connectedNodeId);
          }}
        />
      </AutoLayout>
      {isConnected ? buildKeyList(connectedNodeChildren) : keyList}
    </AutoLayout>
  );
}

widget.register(Widget);
