/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// This is a counter widget with buttons to increment and decrement the number.
import { connnected } from "./plug-connected";
import { disconnected } from "./plug-disconneced";

const { widget } = figma;
const { useSyncedState, SVG, AutoLayout, Text } = widget;

const pluginDataKeys = figma.root.getSharedPluginDataKeys("audit");

function Widget() {
  const frameName = "Connect to node";
  const [keys] = useSyncedState<string[]>("keys", pluginDataKeys);
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

    for (const element of node.children) {
      const id = key.split("_")[0];
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

        const foundElement = await figma.getNodeByIdAsync(id);
        if (!foundElement) return;
        const foundElementPage = findCurrentPage(foundElement);
        if (!foundElementPage) return;
        const highlight = foundElementPage.findChild(
          (node) => node.name === `${id}-highlight`
        );
        const note = foundElementPage.findChild(
          (node) => node.name === `${id}-note`
        );
        if (!highlight || !note) return;
        highlight.remove();
        note.remove();
      }
    }
  }

  function findCurrentPage(node: any): PageNode | null {
    if (node.type === "PAGE") {
      return node;
    } else {
      if (node.parent) {
        const newNode = node.parent;
        return findCurrentPage(newNode);
      } else {
        return null;
      }
    }
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
      setConnectedNodeId(selectedNode.id);
      setConnectedNodeName(selectedNode.name);
      setIsConnected(true);
      if (AcceptedNodeTypes.includes(selectedNode.type)) {
        //@ts-ignore
        if (selectedNode.children) {
          //@ts-ignore
          selectedNode.children.forEach((child: any) => {
            const name = child.name;
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
          }}
        />
      </AutoLayout>
      {isConnected ? buildKeyList(connectedNodeChildren) : keyList}
    </AutoLayout>
  );
}

widget.register(Widget);
