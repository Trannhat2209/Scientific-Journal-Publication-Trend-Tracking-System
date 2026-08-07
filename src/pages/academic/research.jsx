// Generated module from the former App.jsx.
import React from "react";
import DataProvenance from "../../components/academic/DataProvenance";
import { buildPublicationSearchQuery } from "../../services/academic-query";
import useAcademicFilters from "../../hooks/useAcademicFilters";
import { MiniIcon, apiFetch, buildPaperDocxData, buildSearchResultsDocxData, createApiBackedGraphNodes, downloadDocxFile, downloadReferenceExport, dynamicGraphNodePositions, formatAdminDateTime, getAcademicPath, getBookmarkKey, getCurrentAccountPlan, getGraphPaperForNode, getLocalBookmarks, getPublishedPublications, getSearchParam, getSearchTerms, getStoredAuth, goToRoute, graph3DLinks, graph3DNodes, isBackendNumericId, mapPublicationForResearcherList, matchesSearchTerms, mergePublicationsByIdOrTitle, navTo, slugifyFilename, unwrapList, upsertLocalBookmark, useApiResource, useSearchSuggestions } from "../../app/core.jsx";
import { ResearcherShell } from "./shell.jsx";

const openAcademicPublicationDetail = (paper, detailPath, event) => {
  event?.preventDefault();
  const citationCount =
    Number(
      String(paper.citationCount ?? paper.citations ?? "0").replaceAll(",", ""),
    ) || 0;
  const authors = Array.isArray(paper.authors)
    ? paper.authors
    : String(paper.authors || "")
        .split(",")
        .map((author) => author.trim())
        .filter(Boolean);
  window.sessionStorage.setItem(
    "scholartrend.selectedGraphPublication",
    JSON.stringify({
      id: paper.id,
      title: paper.title,
      abstract: paper.abstract || paper.summary || "No abstract is available for this publication yet.",
      authors,
      year: paper.year,
      journalName: paper.journalName || paper.venue || paper.source || "Scientific Journal",
      citationCount,
      doi: paper.doi || "",
      sourceApi: paper.sourceApi || paper.source || paper.venue || "",
      sourceUrl: paper.sourceUrl || "",
      syncedAt: paper.syncedAt || null,
      keywords: paper.keywords || paper.tags || [],
      keywordIds: paper.keywordIds || [],
    }),
  );
  goToRoute(detailPath);
};

function ResearcherSearchTopbar({ onMenuClick, onOpenSettings }) {
  const [queryValue, setQueryValue] = React.useState(
    () => getSearchParam("q") || "",
  );
  React.useEffect(() => {
    const syncQuery = () => setQueryValue(getSearchParam("q") || "");
    window.addEventListener("scholartrend:navigate", syncQuery);
    window.addEventListener("popstate", syncQuery);
    return () => {
      window.removeEventListener("scholartrend:navigate", syncQuery);
      window.removeEventListener("popstate", syncQuery);
    };
  }, []);
  const handleGraphSearchSubmit = (event) => {
    event.preventDefault();
    const query = queryValue.trim();
    const targetPath = query
      ? `/researcher-search?q=${encodeURIComponent(query)}`
      : "/researcher-search";

    window.history.pushState({}, "", getAcademicPath(targetPath));
    window.dispatchEvent(new Event("scholartrend:navigate"));
  };

  return (
    <header className="researcher-graph-topbar">
      <button
        type="button"
        className="researcher-menu-button"
        aria-label="Toggle navigation"
        onClick={onMenuClick}
      >
        <MiniIcon path="M5 5h14v14H5zM9 5v14M12 9h4M12 12h4M12 15h3" />
      </button>
      <nav className="researcher-graph-breadcrumb" aria-label="Breadcrumb">
        <a
          href="/researcher-dashboard"
          onClick={navTo("/researcher-dashboard")}
        >
          Dashboard
        </a>
        <span>&gt;</span>
        <strong>Knowledge Graph</strong>
      </nav>

      <form
        className="researcher-graph-search"
        onSubmit={handleGraphSearchSubmit}
      >
        <button
          type="submit"
          className="graph-search-submit"
          aria-label="Search publications"
        >
          <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6M8.2 10.5h4.6M10.5 8.2v4.6" />
        </button>
        <input
          type="search"
          name="query"
          value={queryValue}
          onChange={(event) => setQueryValue(event.target.value)}
          placeholder="Search title, author, keyword, or DOI..."
          aria-label="Search knowledge graph"
        />
      </form>

      <div className="researcher-graph-actions">
        <button
          type="button"
          className="graph-toolbar-button"
          onClick={navTo("/researcher-search?view=list")}
        >
          <MiniIcon path="M6 6h12M6 12h12M6 18h12M4 6h.01M4 12h.01M4 18h.01" />
          List View
        </button>
        <button type="button" className="graph-toolbar-button active">
          <MiniIcon path="M4 5h16l-6.2 7.1V18l-3.6 1.6v-7.5L4 5ZM8 8h8" />
          Filters
        </button>
        <button type="button" className="graph-icon-button" aria-label="Help">
          <MiniIcon path="M9.8 9a2.2 2.2 0 1 1 3.7 1.6c-.9.7-1.5 1.2-1.5 2.4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM18.5 5.5l1.5-1.5" />
        </button>
        <button
          type="button"
          className="graph-icon-button"
          aria-label="Settings"
          onClick={onOpenSettings}
        >
          <MiniIcon path="M5 7h4M13 7h6M11 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 12h9M18 12h1M16 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 17h2M11 17h8M9 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
        </button>
      </div>
    </header>
  );
}

function ResearcherPublicationTopbar({
  onMenuClick,
  onOpenSettings,
  publicationTitle = "Publication details",
}) {
  return (
    <header className="researcher-topbar researcher-publication-topbar">
      <button
        type="button"
        className="researcher-menu-button"
        aria-label="Toggle navigation"
        onClick={onMenuClick}
      >
        <MiniIcon path="M5 5h14v14H5zM9 5v14M12 9h4M12 12h4M12 15h3" />
      </button>
      <nav className="researcher-breadcrumb" aria-label="Breadcrumb">
        <a href="/researcher-search" onClick={navTo("/researcher-search")}>
          Search
        </a>
        <span>&gt;</span>
        <a href="/researcher-search" onClick={navTo("/researcher-search")}>
          Results
        </a>
        <span>&gt;</span>
        <strong>
          {publicationTitle.length > 52
            ? `${publicationTitle.slice(0, 52)}...`
            : publicationTitle}
        </strong>
      </nav>

      <div className="researcher-top-actions">
        <form
          className="researcher-search"
          onSubmit={navTo("/researcher-search")}
        >
          <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6M8.2 10.5h4.6M10.5 8.2v4.6" />
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search publications"
          />
        </form>
        <button
          type="button"
          className="researcher-top-icon"
          aria-label="Notifications"
          onClick={navTo("/researcher-notifications")}
        >
          <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4M17.5 5.5l2-2M6.5 5.5l-2-2" />
        </button>
        <button
          type="button"
          className="researcher-top-icon"
          aria-label="Settings"
          onClick={onOpenSettings}
        >
          <MiniIcon path="M5 7h4M13 7h6M11 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 12h9M18 12h1M16 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 17h2M11 17h8M9 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
        </button>
        <button
          type="button"
          className="researcher-avatar"
          aria-label="User profile"
          onClick={navTo("/researcher-profile")}
        >
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="Researcher profile"
          />
        </button>
      </div>
    </header>
  );
}

function KnowledgeGraphCanvas({
  nodes = graph3DNodes,
  links = [],
  selectedNodeId,
  onSelectNode,
}) {
  const mountRef = React.useRef(null);
  const labelLayerRef = React.useRef(null);
  const graphActionsRef = React.useRef({ zoomIn: null, zoomOut: null });
  const selectionApiRef = React.useRef(null);
  const selectedNodeIdRef = React.useRef(selectedNodeId);
  const nodesRef = React.useRef(nodes);
  const linksRef = React.useRef(links);
  nodesRef.current = nodes;
  linksRef.current = links;
  const nodesSignature = JSON.stringify(
    nodes.map((node) => [node.id, node.label, node.position, node.size, node.color]),
  );
  const linksSignature = JSON.stringify(links);

  React.useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
    selectionApiRef.current?.applySelection(selectedNodeId);
  }, [selectedNodeId]);

  React.useEffect(() => {
    const mount = mountRef.current;
    const labelLayer = labelLayerRef.current;
    if (!mount || !labelLayer) return undefined;

    let disposed = false;
    let cleanup = () => {};
    const initializeGraph = async () => {
      const [THREE, controlsModule] = await Promise.all([
        import("three"),
        import("three/examples/jsm/controls/OrbitControls.js"),
      ]);
      if (disposed) return;
      const { OrbitControls } = controlsModule;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 1, 1800);
    camera.position.set(0, 0, 780);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0xffffff, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.setAttribute("tabindex", "0");
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    // OrbitControls must not rotate the camera through 360 degrees because the
    // graph is close to a 2D plane and disappears when viewed edge-on. The
    // animation loop below gives the graph a bounded 3D rocking motion instead.
    controls.autoRotate = false;
    controls.minDistance = 360;
    controls.maxDistance = 980;
    controls.enablePan = true;

    const normalizedNodes = nodesRef.current.map((node, index) => ({
      ...node,
      position: Array.isArray(node.position)
        ? node.position
        : dynamicGraphNodePositions[index % dynamicGraphNodePositions.length],
      size: Number(node.size || (index === 0 ? 48 : 32)),
    }));
    const graphGroup = new THREE.Group();
    graphGroup.rotation.x = -0.08;
    graphGroup.rotation.y = -0.18;
    graphGroup.position.x = 22;
    graphGroup.position.y = 110;
    graphGroup.scale.setScalar(0.86);
    scene.add(graphGroup);

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(160, 220, 340);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xc7d2fe, 1.1);
    fillLight.position.set(-260, -120, 220);
    scene.add(fillLight);

    const nodeById = Object.fromEntries(
      normalizedNodes.map((node) => [node.id, node]),
    );
    const labelItems = [];
    const nodeItems = new Map();
    const nodeMeshes = [];
    const suppliedLinks = Array.isArray(linksRef.current) ? linksRef.current : [];
    const graphLinksForUi = suppliedLinks.length
      ? suppliedLinks.filter(
          ([sourceId, targetId]) => nodeById[sourceId] && nodeById[targetId],
        )
      : graph3DLinks.some(
      ([sourceId, targetId]) => nodeById[sourceId] && nodeById[targetId],
    )
      ? graph3DLinks.filter(
          ([sourceId, targetId]) => nodeById[sourceId] && nodeById[targetId],
        )
      : normalizedNodes.slice(1).flatMap((node, index) => {
          const links = [
            [normalizedNodes[0].id, node.id, index < 4 ? "strong" : "faint"],
          ];
          if (index > 0 && index % 2 === 0) {
            links.push([normalizedNodes[index].id, node.id, "faint"]);
          }
          return links;
        });

    graphLinksForUi.forEach(([sourceId, targetId, tone]) => {
      const source = nodeById[sourceId];
      const target = nodeById[targetId];
      if (!source || !target) return;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...source.position),
        new THREE.Vector3(...target.position),
      ]);
      const material = new THREE.LineBasicMaterial({
        color: tone === "strong" ? 0x0f172a : 0xaebfc4,
        transparent: true,
        opacity: tone === "strong" ? 0.34 : 0.12,
      });
      graphGroup.add(new THREE.Line(geometry, material));
    });

    const selectionGroup = new THREE.Group();
    const selectionHalo = new THREE.Mesh(
      new THREE.SphereGeometry(1, 40, 24),
      new THREE.MeshBasicMaterial({
        color: 0xb8cfce,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    );
    const selectionRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.22, 0.055, 16, 120),
      new THREE.MeshBasicMaterial({
        color: 0x9a4a88,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
      }),
    );
    selectionGroup.add(selectionHalo, selectionRing);
    selectionGroup.visible = false;
    graphGroup.add(selectionGroup);

    normalizedNodes.forEach((node) => {
      const selectedRadius = node.size;
      const idleRadius = Math.max(node.size * 0.42, 8);
      const isActiveNode = node.id === selectedNodeIdRef.current;
      const radius = isActiveNode ? selectedRadius : idleRadius;
      const position = new THREE.Vector3(...node.position);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(node.color),
        transparent: true,
        opacity: isActiveNode ? 0.72 : 0.82,
        roughness: 0.48,
        metalness: 0.05,
      });
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 40, 24),
        material,
      );
      sphere.position.copy(position);
      sphere.scale.setScalar(radius);
      sphere.userData.nodeId = node.id;
      graphGroup.add(sphere);
      nodeMeshes.push(sphere);

      const label = document.createElement("span");
      label.className =
        node.id === selectedNodeIdRef.current
          ? "graph-3d-label selected"
          : "graph-3d-label";
      label.textContent = node.label;
      labelLayer.appendChild(label);
      const item = {
        label,
        sphere,
        material,
        node,
        idleRadius,
        selectedRadius,
        currentRadius: radius,
      };
      labelItems.push(item);
      nodeItems.set(node.id, item);
    });

    const applySelection = (nodeId) => {
      const fallbackNodeId = normalizedNodes[0]?.id || "deepfruits";
      const nextNodeId = nodeItems.has(nodeId) ? nodeId : fallbackNodeId;
      const selectedItem = nodeItems.get(nextNodeId);
      selectedNodeIdRef.current = nextNodeId;

      nodeItems.forEach((item, itemId) => {
        const active = itemId === nextNodeId;
        item.material.opacity = active ? 0.72 : 0.82;
        item.material.emissive.set(active ? 0x6d4df2 : 0x000000);
        item.material.emissiveIntensity = active ? 0.08 : 0;
        item.label.className = active
          ? "graph-3d-label selected"
          : "graph-3d-label";
      });

      if (selectedItem) {
        selectionGroup.visible = true;
        selectionGroup.position.copy(selectedItem.sphere.position);
        selectionGroup.scale.setScalar(selectedItem.currentRadius);
      }
    };

    selectionApiRef.current = { applySelection };
    applySelection(selectedNodeIdRef.current);
    let graphZoom = 0.86;

    const resize = () => {
      const width = Math.max(mount.clientWidth, 320);
      const height = Math.max(mount.clientHeight, 320);
      const isNarrow = width < 620;
      const baseZoom = isNarrow ? 0.78 : 0.86;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = isNarrow ? 1160 : 920;
      graphGroup.position.x = isNarrow ? -46 : 54;
      graphGroup.position.y = isNarrow ? 84 : 92;
      graphZoom = baseZoom;
      graphGroup.scale.setScalar(graphZoom);
      controls.target.set(graphGroup.position.x, graphGroup.position.y, 0);
      controls.minDistance = isNarrow ? 760 : 520;
      controls.maxDistance = isNarrow ? 1420 : 1180;
      camera.updateProjectionMatrix();
      controls.update();
    };

    const setGraphZoom = (nextZoom) => {
      graphZoom = THREE.MathUtils.clamp(nextZoom, 0.62, 1.42);
      graphGroup.scale.setScalar(graphZoom);
      controls.autoRotate = false;
      controls.update();
    };

    graphActionsRef.current.zoomIn = () => setGraphZoom(graphZoom * 1.16);
    graphActionsRef.current.zoomOut = () => setGraphZoom(graphZoom / 1.16);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDown = null;

    const getIntersectedNodeId = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(nodeMeshes, false)[0]?.object.userData
        .nodeId;
    };

    const handlePointerDown = (event) => {
      pointerDown = { x: event.clientX, y: event.clientY };
      controls.autoRotate = false;
    };

    const handlePointerMove = (event) => {
      renderer.domElement.style.cursor = getIntersectedNodeId(event)
        ? "pointer"
        : "grab";
    };

    const handlePointerUp = (event) => {
      if (!pointerDown) return;
      const moved = Math.hypot(
        event.clientX - pointerDown.x,
        event.clientY - pointerDown.y,
      );
      pointerDown = null;
      if (moved > 7) return;

      const nodeId = getIntersectedNodeId(event);
      if (!nodeId) return;
      applySelection(nodeId);
      onSelectNode?.(nodeId);
    };

    const handlePointerLeave = () => {
      renderer.domElement.style.cursor = "grab";
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

    const projectedPosition = new THREE.Vector3();
    const worldPosition = new THREE.Vector3();
    let frameId = 0;

    const animate = (timestamp = 0) => {
      frameId = window.requestAnimationFrame(animate);
      graphGroup.rotation.y = -0.18 + Math.sin(timestamp * 0.00038) * 0.2;
      graphGroup.rotation.x = -0.08 + Math.cos(timestamp * 0.00031) * 0.035;
      controls.update();
      selectionRing.quaternion.copy(camera.quaternion);

      const width = mount.clientWidth;
      const height = mount.clientHeight;
      labelItems.forEach(({ label, sphere, node, currentRadius }) => {
        const isSelected = node.id === selectedNodeIdRef.current;
        sphere.getWorldPosition(worldPosition);
        const offset = currentRadius + (isSelected ? 34 : 18);
        worldPosition.y += offset;
        projectedPosition.copy(worldPosition).project(camera);
        const x = (projectedPosition.x * 0.5 + 0.5) * width;
        const y = (-projectedPosition.y * 0.5 + 0.5) * height;
        const visible = projectedPosition.z < 1;
        const depthScale = THREE.MathUtils.clamp(
          1.08 - projectedPosition.z * 0.22,
          0.72,
          1.08,
        );
        label.style.opacity = visible ? (isSelected ? "1" : "0.86") : "0";
        label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${depthScale})`;
      });

      renderer.render(scene, camera);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);

    cleanup = () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener(
        "pointerleave",
        handlePointerLeave,
      );
      graphActionsRef.current.zoomIn = null;
      graphActionsRef.current.zoomOut = null;
      selectionApiRef.current = null;
      controls.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
      // Explicitly release the GPU context. In the SPA, Search can be mounted
      // repeatedly (and development StrictMode mounts effects twice); dispose()
      // alone leaves contexts alive long enough for browsers to hit their limit.
      renderer.forceContextLoss();
      mount.replaceChildren();
      labelLayer.replaceChildren();
    };
    };

    initializeGraph().catch((error) => {
      if (!disposed) console.error("Knowledge graph failed to load", error);
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [linksSignature, nodesSignature, onSelectNode]);

  return (
    <section
      className="knowledge-graph-panel"
      aria-label="Research knowledge graph"
    >
      <div
        className="knowledge-graph-webgl"
        ref={mountRef}
        aria-hidden="true"
      ></div>
      <div
        className="knowledge-graph-label-layer"
        ref={labelLayerRef}
        aria-hidden="true"
      ></div>

      <div className="graph-zoom-controls" aria-label="Zoom controls">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => graphActionsRef.current.zoomIn?.()}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => graphActionsRef.current.zoomOut?.()}
        >
          -
        </button>
      </div>

      <div className="graph-bottom-bar">
        <button type="button" className="compare-paper-button" onClick={navTo("/researcher-search?view=list&compare=1")}>
          <MiniIcon path="M12 5v14M5 12h14" />
          Compare New Paper
        </button>
        <label className="year-range-control">
          <span>Year Range</span>
          <em>2010</em>
          <input
            type="range"
            min="2010"
            max="2024"
            defaultValue="2020"
            aria-label="Start year"
          />
          <input
            type="range"
            min="2010"
            max="2024"
            defaultValue="2024"
            aria-label="End year"
          />
          <em>2024</em>
        </label>
      </div>
    </section>
  );
}

function ResearcherPaperPanel({ selectedNode }) {
  const selectedPaper = getGraphPaperForNode(selectedNode);
  const isLecturerRoute = window.location.pathname.startsWith("/lecturer-");
  const bookmarksPath = isLecturerRoute
    ? "/lecturer-bookmarks"
    : "/researcher-bookmarks";
  const detailPath = `/${isLecturerRoute ? "lecturer" : "researcher"}-publication${
    selectedPaper.id ? `?id=${encodeURIComponent(selectedPaper.id)}` : ""
  }`;
  const [metadataSaved, setMetadataSaved] = React.useState(false);
  const [bookmarkMessage, setBookmarkMessage] = React.useState("");
  React.useEffect(() => {
    setMetadataSaved(false);
    setBookmarkMessage("");
  }, [selectedPaper.id, selectedPaper.title]);

  const openSelectedPaper = (event) => {
    openAcademicPublicationDetail(selectedPaper, detailPath, event);
  };

  const saveSelectedPaper = async () => {
    setBookmarkMessage("Saving bookmark…");
    try {
      const citationCount = Number(String(selectedPaper.citations || "0").replaceAll(",", "")) || 0;
      if (isBackendNumericId(selectedPaper.id)) {
        await apiFetch(`/api/bookmarks/${selectedPaper.id}`, { method: "POST", auth: true });
      } else {
        await apiFetch("/api/bookmarks/metadata", {
          method: "POST",
          auth: true,
          body: {
            title: selectedPaper.title,
            abstract: selectedPaper.abstract || "",
            doi: selectedPaper.doi || "",
            year: Number(selectedPaper.year) || new Date().getFullYear(),
            citationCount,
            sourceApi: selectedPaper.sourceApi || selectedPaper.venue || "External academic source",
            sourceUrl: selectedPaper.sourceUrl || "",
          },
        });
      }
      setMetadataSaved(true);
      setBookmarkMessage(`Saved "${selectedPaper.title}" to your account bookmarks.`);
    } catch (error) {
      setMetadataSaved(false);
      setBookmarkMessage(`Bookmark was not saved: ${error.message}`);
    }
  };

  return (
    <aside
      className="researcher-paper-panel"
      aria-label="Selected research paper"
    >
      <div className="paper-panel-actions">
        <span>Selected Node</span>
        <div>
          <button type="button" aria-label="Share paper" onClick={async () => {
            const url = selectedPaper.sourceUrl || window.location.href;
            try {
              if (navigator.share) await navigator.share({ title: selectedPaper.title, url });
              else await navigator.clipboard.writeText(url);
              setBookmarkMessage("Publication link shared or copied.");
            } catch (error) {
              if (error.name !== "AbortError") setBookmarkMessage("Unable to share this publication.");
            }
          }}>
            <MiniIcon path="M18 8a3 3 0 1 0-2.8-4M6 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.3 6.8 8.7 15.2M8.7 8.8l6.6 3.7" />
          </button>
          <button
            type="button"
            aria-label="Open paper"
            onClick={openSelectedPaper}
          >
            <MiniIcon path="M7 7h10v10M7 17 17 7" />
          </button>
        </div>
      </div>

      <h1>
        <a href={detailPath} onClick={openSelectedPaper}>
          {selectedPaper.title}
        </a>
      </h1>
      <p className="paper-authors">{selectedPaper.authors}</p>
      <div className="paper-meta-row">
        <span>{selectedPaper.year}</span>
        <span>
          <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
          {selectedPaper.venue}
        </span>
      </div>
      <DataProvenance
        source={selectedPaper.sourceApi || selectedPaper.venue}
        sourceUrl={selectedPaper.sourceUrl}
        syncedAt={selectedPaper.syncedAt}
      />

      <div className="paper-metric-grid">
        <div>
          <span>Node Relevance</span>
          <strong>{selectedPaper.similarity}</strong>
          <MiniIcon path="M12 5v14M5 12h14" />
        </div>
        <div>
          <span>Citations</span>
          <strong>{selectedPaper.citations}</strong>
          <em>99</em>
        </div>
      </div>

      <section className="paper-summary">
        <h2>Abstract Summary</h2>
        <p>{selectedPaper.abstract}</p>
        <a href={detailPath} onClick={openSelectedPaper}>
          Read full abstract
        </a>
      </section>

      <div className="paper-save-actions">
        <button
          type="button"
          className={`save-link-only ${metadataSaved ? "saved" : ""}`}
          onClick={saveSelectedPaper}
        >
          <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
          {metadataSaved ? "Metadata Saved" : "Save Metadata & Link"}
        </button>
      </div>
      {bookmarkMessage ? (
        <p className="paper-save-status" role="status">
          {bookmarkMessage}{" "}
          <a href={bookmarksPath} onClick={navTo(bookmarksPath)}>
            Open bookmarks
          </a>
        </p>
      ) : null}

      <section className="paper-access-points">
        <h2>Access Points</h2>
        {selectedPaper.accessPoints.map((point, index) => (
          <a
            href={point.href}
            target="_blank"
            rel="noreferrer"
            key={point.href}
          >
            <MiniIcon
              path={
                index === 0
                  ? "M7 5h10v14H7zM10 9h4M10 12h4M10 15h3"
                  : "M12 4 5 19h14L12 4ZM12 9v4M12 16h.01"
              }
            />
            {point.label}
          </a>
        ))}
      </section>
      <PublicationReviewPanel publication={selectedPaper} />
    </aside>
  );
}

const listViewPapers = [
  {
    id: "deepfruits",
    title: "DeepFruits: A Fruit Detection System Using Deep Neural Networks",
    authors: "Inkyu Sa, ZongYuan Ge, Feras Dayoub, B. Upcroft, Tristan Perez",
    year: 2016,
    citations: 986,
    references: 38,
    similarity: 100,
  },
  {
    id: "bell-pepper",
    title: "Automated Bell Pepper Harvesting using Robotic Vision System",
    authors: "Silpa Ajith Kumar, J. S. Kumar",
    year: 2019,
    citations: 0,
    references: 23,
    similarity: 43.5,
    summary:
      "The automation technology used in harvesting the yellow bell pepper makes use of open source computer vision platform to detect the crop amidst the foliage using various image processing techniques and send appropriate signals to move the robot to harvest the crop.",
    tags: ["Computer Vision", "Robotic Harvesting", "Agricultural Automation"],
  },
  {
    id: "fruit-classification",
    title:
      "Automatic Fruits Classification System Based on Deep Neural Networks",
    authors: "Khadija Munir, A. I. Umar, Waqas Yousaf",
    year: 2020,
    citations: 7,
    references: 27,
    similarity: 42,
  },
  {
    id: "cnn-fruit",
    title:
      "Convolutional Neural Networks (CNN) for Detecting Fruit in Orchards",
    authors: "Fouzia Risdin, P. Mondal, Kazi Mahmudul Hassan",
    year: 2020,
    citations: 21,
    references: 28,
    similarity: 41,
  },
  {
    id: "orchard-detection",
    title: "Deep fruit detection in orchards",
    authors: "Suchet Bargoti, J. Underwood",
    year: 2016,
    citations: 494,
    references: 24,
    similarity: 40.1,
  },
  {
    id: "detsseg",
    title: "DetSSeg: A Selective On-Field Pomegranate Segmentation Method",
    authors: "Shubham S. Mane, Prashant Bartakke, Tulshidas S.",
    year: 2023,
    citations: 2,
    references: 25,
    similarity: 39.3,
  },
  {
    id: "occluded-crop",
    title: "Visual detection of occluded crop: For automated harvesting",
    authors: "C. McCool, Inkyu Sa, Feras Dayoub, Christopher Lehnert",
    year: 2016,
    citations: 77,
    references: 17,
    similarity: 29.2,
  },
  {
    id: "image-segmentation",
    title: "Image Segmentation for Fruit Detection and Yield Estimation",
    authors: "Suchet Bargoti, J. Underwood",
    year: 2016,
    citations: 444,
    references: 56,
    similarity: 26.6,
  },
];

function ResearcherListTopbar({ onMenuClick, onOpenSettings }) {
  const [queryValue, setQueryValue] = React.useState(getSearchParam("q") || "");
  const [relationMode, setRelationMode] = React.useState(getSearchParam("relation") || "");
  React.useEffect(() => {
    const syncQuery = () => setQueryValue(getSearchParam("q") || "");
    window.addEventListener("scholartrend:navigate", syncQuery);
    window.addEventListener("popstate", syncQuery);
    syncQuery();
    return () => {
      window.removeEventListener("scholartrend:navigate", syncQuery);
      window.removeEventListener("popstate", syncQuery);
    };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = queryValue.trim();
    const targetPath = query
      ? `/researcher-search?view=list&q=${encodeURIComponent(query)}`
      : "/researcher-search?view=list";
    window.history.pushState({}, "", getAcademicPath(targetPath));
    window.dispatchEvent(new Event("scholartrend:navigate"));
  };

  return (
    <header className="researcher-list-topbar">
      <button
        type="button"
        className="researcher-menu-button researcher-list-menu"
        aria-label="Toggle navigation"
        onClick={onMenuClick}
      >
        <MiniIcon path="M5 5h14v14H5zM9 5v14M12 9h4M12 12h4M12 15h3" />
      </button>
      <form className="researcher-list-search" onSubmit={handleSubmit}>
        <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6" />
        <input
          type="search"
          placeholder="Search for a paper, author or concept..."
          aria-label="Search list results"
          value={queryValue}
          onChange={(event) => setQueryValue(event.target.value)}
        />
      </form>

      <nav className="researcher-list-relations" aria-label="Paper relations">
        <button type="button" className={relationMode === "prior" ? "active" : ""} onClick={() => { setRelationMode("prior"); goToRoute(`/researcher-search?view=list&relation=prior${queryValue.trim() ? `&q=${encodeURIComponent(queryValue.trim())}` : ""}`); }}>Prior works</button>
        <button type="button" className={relationMode === "derivative" ? "active" : ""} onClick={() => { setRelationMode("derivative"); goToRoute(`/researcher-search?view=list&relation=derivative${queryValue.trim() ? `&q=${encodeURIComponent(queryValue.trim())}` : ""}`); }}>Derivative works</button>
      </nav>

      <div className="researcher-list-view-toggle" aria-label="Result view">
        <button type="button" className="active">
          <MiniIcon path="M7 7h12M7 12h12M7 17h12M4 7h.01M4 12h.01M4 17h.01" />
          List view
        </button>
        <button
          type="button"
          onClick={navTo(
            queryValue.trim()
              ? `/researcher-search?q=${encodeURIComponent(queryValue.trim())}`
              : "/researcher-search",
          )}
        >
          <MiniIcon path="M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 6l8 4M8 18l8-6M6 7v10" />
          Graph view
        </button>
      </div>

      <span className="researcher-list-divider" aria-hidden="true"></span>
      <div className="researcher-list-utilities">
        <button type="button" aria-label="Filter results">
          <MiniIcon path="M5 7h14M8 12h8M10 17h4" />
        </button>
        <button type="button" aria-label="Settings" onClick={onOpenSettings}>
          <MiniIcon path="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.9 3.2-.2-.1a1.8 1.8 0 0 0-2 .2 1.8 1.8 0 0 0-.7 1.7v.2H9v-.2a1.8 1.8 0 0 0-.7-1.7 1.8 1.8 0 0 0-2-.2l-.2.1-1.9-3.2.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.5-1.1H3v-3.8h.2A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1 1.9-3.2.2.1a1.8 1.8 0 0 0 2-.2A1.8 1.8 0 0 0 9 1.9v-.2h6v.2a1.8 1.8 0 0 0 .7 1.7 1.8 1.8 0 0 0 2 .2l.2-.1 1.9 3.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.5 1.1h.2v3.8h-.2A1.8 1.8 0 0 0 19.4 15Z" />
        </button>
        <button type="button" aria-label="Help">
          <MiniIcon path="M9.8 9a2.2 2.2 0 1 1 3.7 1.6c-.9.7-1.5 1.2-1.5 2.4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </button>
      </div>
    </header>
  );
}

function ResearcherListDetail({ paper, onDownloadPaper }) {
  const [originAdded, setOriginAdded] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const isLecturerRoute = window.location.pathname.startsWith("/lecturer-");
  const detailPath = `/${isLecturerRoute ? "lecturer" : "researcher"}-publication${paper.id ? `?id=${encodeURIComponent(paper.id)}` : ""}`;
  const summary =
    paper.summary ||
    `This publication explores ${paper.title.toLowerCase()} through a practical computer vision workflow, connecting detection accuracy with reliable deployment in field conditions.`;
  const tags = paper.tags || [
    "Computer Vision",
    "Deep Learning",
    "Fruit Detection",
  ];

  React.useEffect(() => {
    setOriginAdded(false);
    setSaved(false);
  }, [paper.id]);

  return (
    <aside
      className="researcher-list-detail"
      aria-label="Selected paper details"
    >
      <div className="researcher-list-detail-flags">
        <span>Top Similarity</span>
        <span>Highly Cited</span>
        <button type="button" aria-label="More paper actions">
          <MiniIcon path="M12 5.5h.01M12 12h.01M12 18.5h.01" />
        </button>
      </div>

      <h2>{paper.title}</h2>
      <p className="researcher-list-detail-authors">{paper.authors}</p>
      <div className="researcher-list-detail-meta">
        <span>{paper.year}</span>
        <span>|</span>
        <span>{paper.citations} Citations</span>
      </div>
      <DataProvenance source={paper.sourceApi || paper.source || paper.journalName} sourceUrl={paper.sourceUrl} syncedAt={paper.syncedAt} />

      <div className="researcher-list-primary-actions">
        <button
          type="button"
          onClick={navTo(
            `/researcher-search?q=${encodeURIComponent(paper.title)}`,
          )}
        >
          <MiniIcon path="M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 6l8 4M8 18l8-6M6 7v10" />
          Open graph
        </button>
        <button
          type="button"
          onClick={(event) =>
            openAcademicPublicationDetail(paper, detailPath, event)
          }
        >
          <MiniIcon path="M6 4.5h12v15H6zM9 8h6M9 11h6M9 14h4" />
          Open detail
        </button>
        <button type="button" onClick={() => onDownloadPaper?.(paper)}>
          <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
          Download DOCX
        </button>
      </div>

      <button
        type="button"
        className={`researcher-list-save ${saved ? "saved" : ""}`}
        onClick={() => setSaved((value) => !value)}
      >
        <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
        {saved ? "Saved to collection" : "Save to collection"}
      </button>

      <section className="researcher-list-open-in">
        <h3>Open in</h3>
        <div>
          <a
            href={`https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`}
            target="_blank"
            rel="noreferrer"
          >
            Google Scholar
          </a>
          <a
            href={
              paper.doi
                ? `https://doi.org/${encodeURIComponent(paper.doi)}`
                : `https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`
            }
            target="_blank"
            rel="noreferrer"
          >
            <MiniIcon path="M7 4h8l3 3v13H7zM15 4v4h3M10 12h5M10 15h4" />
            DOI.org
          </a>
        </div>
      </section>

      <section className="researcher-list-tldr">
        <h3>
          <MiniIcon path="M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 11h6M9 14h5" />
          S2 TL;DR
        </h3>
        <p>"{summary}"</p>
      </section>

      <section className="researcher-list-tags">
        <h3>Key metaphors &amp; trends</h3>
        <div>
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>

      <div
        className="researcher-vision-preview"
        aria-label="Vision processing simulation preview"
      >
        <div className="researcher-vision-arm">
          <i></i>
          <i></i>
          <i></i>
        </div>
        <span>Vision Processing Simulation</span>
      </div>
      <PublicationReviewPanel publication={paper} />
    </aside>
  );
}

function ResearcherListViewPage() {
  const [selectedPaperId, setSelectedPaperId] = React.useState("bell-pepper");
  const [query, setQuery] = React.useState(getSearchParam("q") || "");
  const [sortBy, setSortBy] = React.useState("year");
  const [advancedFilters, setAdvancedFilters] = React.useState({
    journal: "", researchTopic: "", yearFrom: "2010",
    yearTo: String(new Date().getFullYear()), sourceApi: "", minCitations: "", maxCitations: "",
  });
  React.useEffect(() => {
    const syncUrlQuery = () => {
      const urlKeyword = getSearchParam("q") || "";
      setQuery((current) => (current === urlKeyword ? current : urlKeyword));
      setSelectedPaperId("");
    };
    window.addEventListener("scholartrend:navigate", syncUrlQuery);
    window.addEventListener("popstate", syncUrlQuery);
    syncUrlQuery();
    return () => {
      window.removeEventListener("scholartrend:navigate", syncUrlQuery);
      window.removeEventListener("popstate", syncUrlQuery);
    };
  }, []);

  const { data: listSuggestions } = useSearchSuggestions(query, 8);
  const accountPlan = getCurrentAccountPlan();
  const listApiPath = React.useMemo(() => {
    const params = new URLSearchParams({
      page: "1",
      pageSize: "10",
      sortBy,
    });
    if (query.trim()) params.set("keyword", query.trim());
    Object.entries(advancedFilters).forEach(([key, value]) => {
      if (String(value).trim()) {
        params.set(key === "sourceApi" ? "source" : key, String(value).trim());
      }
    });
    return `/api/publications/search?${params.toString()}`;
  }, [query, sortBy, advancedFilters]);
  const { data: backendPapers, status: listStatus } = useApiResource(
    listApiPath,
    [],
    {
      auth: true,
      clearOnLoad: false,
      select: (payload) =>
        unwrapList(payload).map((paper) =>
          mapPublicationForResearcherList(
            paper,
            accountPlan.searchAccuracy,
            query,
          ),
        ),
    },
  );
  const publishedListPapers = React.useMemo(
    () =>
      getPublishedPublications().map((paper) =>
        mapPublicationForResearcherList(
          paper,
          accountPlan.searchAccuracy,
          query,
        ),
      ),
    [accountPlan.searchAccuracy, query],
  );
  const filteredPublishedListPapers = React.useMemo(() => {
    const keywordTerms = getSearchTerms(query);
    return publishedListPapers.filter((paper) =>
      matchesSearchTerms(
        `${paper.title} ${paper.authors} ${paper.summary} ${paper.tags?.join(" ")}`,
        keywordTerms,
      ),
    );
  }, [publishedListPapers, query]);
  const papersForUi = React.useMemo(() => {
    return mergePublicationsByIdOrTitle(
      filteredPublishedListPapers,
      backendPapers,
    ).sort((left, right) => {
      if (sortBy === "title") return left.title.localeCompare(right.title);
      if (sortBy === "citations") return right.citations - left.citations;
      return Number(right.year || 0) - Number(left.year || 0);
    });
  }, [filteredPublishedListPapers, backendPapers, sortBy]);
  React.useEffect(() => {
    if (papersForUi.length) {
      setSelectedPaperId(papersForUi[0].id);
    }
  }, [papersForUi]);
  const selectedPaper =
    papersForUi.find((paper) => paper.id === selectedPaperId) ||
    papersForUi[0] ||
    null;

  const downloadResults = () => {
    downloadDocxFile(
      query.trim()
        ? `${slugifyFilename(query, "scholartrend-search")}-papers.docx`
        : "scholartrend-search-papers.docx",
      buildSearchResultsDocxData(papersForUi, query),
    );
  };
  const downloadPaper = (paper) => {
    if (!paper) return;
    downloadDocxFile(
      `${slugifyFilename(paper.title)}.docx`,
      buildPaperDocxData(paper, query),
    );
  };
  const exportReferences = (format) =>
    downloadReferenceExport({
      format,
      ids: papersForUi.map((paper) => paper.id),
      query,
    }).catch(() => {});

  return (
    <ResearcherShell
      activeRoute="/researcher-search"
      topbar="list"
      pageClassName="researcher-list-view-page"
      mainClassName="researcher-list-shell-main"
    >
      <div className="researcher-list-workspace">
        <section className="researcher-list-results">
          <header className="researcher-list-heading">
            <div>
              <h1>
                {query.trim()
                  ? listStatus === "loading"
                    ? `Searching "${query.trim()}"...`
                    : `Search results for "${query.trim()}"`
                  : "DeepFruits: A Fruit Detection System"}
              </h1>
              <p>
                Knowledge Graph <span>&gt;</span> <strong>List View</strong>
              </p>
            </div>
            <div>
              <button type="button" onClick={downloadResults}>
                <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
                Download Papers
              </button>
              <button type="button" onClick={() => exportReferences("bibtex")}>
                <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
                BibTeX
              </button>
              <button type="button" onClick={() => exportReferences("ris")}>
                <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
                RIS
              </button>
              <label className="researcher-list-inline-filter">
                <span>Search</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Keyword, title, author..."
                  list="researcher-list-search-suggestions"
                />
                <datalist id="researcher-list-search-suggestions">
                  {listSuggestions.map((suggestion) => (
                    <option value={suggestion} key={suggestion} />
                  ))}
                </datalist>
              </label>
              <label className="researcher-list-inline-filter">
                <span>Sort</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="year">Year</option>
                  <option value="citations">Citations</option>
                  <option value="title">Title</option>
                </select>
              </label>
              <label className="researcher-list-inline-filter"><span>Journal</span><input value={advancedFilters.journal} placeholder="All journals" onChange={(event) => setAdvancedFilters((current) => ({ ...current, journal: event.target.value }))} /></label>
              <label className="researcher-list-inline-filter"><span>Field</span><input value={advancedFilters.researchTopic} placeholder="All fields" onChange={(event) => setAdvancedFilters((current) => ({ ...current, researchTopic: event.target.value }))} /></label>
              <label className="researcher-list-inline-filter"><span>Years</span><input type="number" value={advancedFilters.yearFrom} aria-label="Researcher start year" onChange={(event) => setAdvancedFilters((current) => ({ ...current, yearFrom: event.target.value }))} /><input type="number" value={advancedFilters.yearTo} aria-label="Researcher end year" onChange={(event) => setAdvancedFilters((current) => ({ ...current, yearTo: event.target.value }))} /></label>
              <label className="researcher-list-inline-filter"><span>Citations</span><input type="number" min="0" value={advancedFilters.minCitations} placeholder="Min" aria-label="Researcher minimum citations" onChange={(event) => setAdvancedFilters((current) => ({ ...current, minCitations: event.target.value }))} /><input type="number" min="0" value={advancedFilters.maxCitations} placeholder="Max" aria-label="Researcher maximum citations" onChange={(event) => setAdvancedFilters((current) => ({ ...current, maxCitations: event.target.value }))} /></label>
              <button
                type="button"
                aria-label="Close list view"
                onClick={navTo("/researcher-search")}
              >
                <MiniIcon path="M6 6l12 12M18 6 6 18" />
              </button>
            </div>
          </header>

          <div className="researcher-list-table-wrap">
            <table className="researcher-list-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Authors</th>
                  <th>Year</th>
                  <th>Citations</th>
                  <th>References</th>
                  <th>Similarity</th>
                  <th>Source / synced</th>
                </tr>
              </thead>
              <tbody>
                {listStatus === "loading" ? (
                  <tr>
                    <td colSpan="7">Loading publications...</td>
                  </tr>
                ) : papersForUi.length ? (
                  papersForUi.map((paper) => (
                    <tr
                      className={paper.id === selectedPaperId ? "selected" : ""}
                      key={paper.id}
                      onClick={() => setSelectedPaperId(paper.id)}
                    >
                      <td>
                        <button type="button">{paper.title}</button>
                      </td>
                      <td>{paper.authors}</td>
                      <td>{paper.year}</td>
                      <td>{paper.citations}</td>
                      <td>{paper.references}</td>
                      <td>
                        <span className="researcher-list-similarity">
                          <i style={{ width: `${paper.similarity}%` }}></i>
                        </span>
                        <strong>{paper.similarity.toFixed(1)}</strong>
                      </td>
                      <td><DataProvenance source={paper.sourceApi || paper.source} sourceUrl={paper.sourceUrl} syncedAt={paper.syncedAt} compact /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No publications matched this search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedPaper ? (
          <ResearcherListDetail
            paper={selectedPaper}
            onDownloadPaper={downloadPaper}
          />
        ) : (
          <aside
            className="researcher-list-detail"
            aria-label="Selected paper details"
          >
            <h2>
              {listStatus === "loading"
                ? "Loading selected paper..."
                : "No paper selected"}
            </h2>
            <p className="researcher-list-detail-authors">
              {listStatus === "loading"
                ? "Fetching real publication data from connected sources."
                : "Try another keyword or switch back to All Sources."}
            </p>
          </aside>
        )}
      </div>
    </ResearcherShell>
  );
}

function ResearcherSearchPage() {
  const view = new URLSearchParams(window.location.search).get("view");
  const { filters: graphFilters } = useAcademicFilters({
    keyword: getSearchParam("q") || "",
  });
  const [graphQuery, setGraphQuery] = React.useState(
    () => getSearchParam("q") || "",
  );
  React.useEffect(() => {
    const syncQuery = () => setGraphQuery(getSearchParam("q") || "");
    window.addEventListener("scholartrend:navigate", syncQuery);
    window.addEventListener("popstate", syncQuery);
    return () => {
      window.removeEventListener("scholartrend:navigate", syncQuery);
      window.removeEventListener("popstate", syncQuery);
    };
  }, []);
  const accountPlan = getCurrentAccountPlan();
  const graphApiPath = React.useMemo(() => {
    const queryFilters = {
      ...graphFilters,
      keyword: graphQuery.trim() || graphFilters.keyword,
      // Connected Papers needs a seed publication from an indexed source;
      // it is then applied by the relationship-network endpoint.
      sourceApi:
        graphFilters.sourceApi === "Connected Papers"
          ? ""
          : graphFilters.sourceApi,
    };
    const filterQuery = buildPublicationSearchQuery(queryFilters, {
      page: 1,
      pageSize: graph3DNodes.length,
    });
    return `/api/publications/search?${filterQuery}`;
  }, [graphQuery, graphFilters]);
  const { data: backendGraphPublications } = useApiResource(
    graphApiPath,
    [],
    {
      auth: true,
      select: (payload) => unwrapList(payload),
    },
  );
  const localPublishedPublications = React.useMemo(
    () => getPublishedPublications(),
    [],
  );
  const graphSeedId = backendGraphPublications[0]?.id;
  const relationshipApiPath = graphSeedId
    ? `/api/publications/${encodeURIComponent(graphSeedId)}/network`
    : null;
  const { data: relationshipNetwork } = useApiResource(
    relationshipApiPath,
    { nodes: [], edges: [] },
    { auth: true },
  );
  const graphNodesForUi = React.useMemo(() => {
    const relationshipNodes = Array.isArray(relationshipNetwork?.nodes)
      ? relationshipNetwork.nodes
      : [];
    if (relationshipNodes.length) {
      return relationshipNodes.slice(0, graph3DNodes.length).map((node, index) => {
        const layoutNode = graph3DNodes[index] || graph3DNodes[0];
        const authors = Array.isArray(node.authors) ? node.authors : [];
        const authorLabel = String(authors[0] || "Paper")
          .trim()
          .split(/\s+/)
          .slice(-1)[0];
        return {
          ...layoutNode,
          id: String(node.id),
          label: `${authorLabel}, ${node.year || "Published"}`,
          color:
            node.type === "Central"
              ? "#c3d8d7"
              : node.type === "ConnectedPapers"
                ? "#a7c7e7"
                : layoutNode.color,
          size:
            node.type === "Central"
              ? 48
              : Math.max(
                  16,
                  Math.min(
                    42,
                    18 + Math.log10(Number(node.citationCount || 0) + 1) * 7,
                  ),
                ),
          published: true,
          paper: {
            id: node.id,
            title: node.title || node.label,
            year: node.year,
            citationCount: node.citationCount || 0,
            authors,
            abstract:
              node.abstract ||
              "Related through the Connected Papers similarity graph.",
            journalName:
              node.type === "ConnectedPapers"
                ? "Connected Papers"
                : "ScholarTrend Indexed",
            sourceApi: node.source || node.type,
            sourceUrl: node.sourceUrl,
            syncedAt: node.syncedAt,
          },
        };
      });
    }
    const realPublications = mergePublicationsByIdOrTitle(
      backendGraphPublications,
      localPublishedPublications,
    );
    return createApiBackedGraphNodes(
      realPublications,
      accountPlan.searchAccuracy,
    );
  }, [
    backendGraphPublications,
    localPublishedPublications,
    relationshipNetwork,
    accountPlan.searchAccuracy,
  ]);
  const graphLinksForUi = React.useMemo(() => {
    const visibleIds = new Set(graphNodesForUi.map((node) => String(node.id)));
    const edges = Array.isArray(relationshipNetwork?.edges)
      ? relationshipNetwork.edges
      : [];
    return edges
      .filter(
        (edge) =>
          visibleIds.has(String(edge.source)) &&
          visibleIds.has(String(edge.target)),
      )
      .map((edge) => [
        String(edge.source),
        String(edge.target),
        Number(edge.weight || 0) >= 0.5 ? "strong" : "faint",
      ]);
  }, [graphNodesForUi, relationshipNetwork]);
  const [selectedNodeId, setSelectedNodeId] = React.useState(
    graphNodesForUi[0]?.id || "deepfruits",
  );
  React.useEffect(() => {
    if (
      graphNodesForUi.length &&
      !graphNodesForUi.some((node) => node.id === selectedNodeId)
    ) {
      setSelectedNodeId(graphNodesForUi[0].id);
    }
  }, [graphNodesForUi, selectedNodeId]);
  const selectedNode = React.useMemo(
    () =>
      graphNodesForUi.find((node) => node.id === selectedNodeId) ||
      graphNodesForUi[0] || null,
    [selectedNodeId, graphNodesForUi],
  );

  if (view === "list") return <ResearcherListViewPage />;

  return (
    <ResearcherShell
      activeRoute="/researcher-search"
      topbar="graph"
      pageClassName="researcher-search-page"
      mainClassName="researcher-graph-main"
    >
      <div className="researcher-graph-layout">
        {selectedNode ? (
          <>
            <KnowledgeGraphCanvas
              nodes={graphNodesForUi}
              links={graphLinksForUi}
              selectedNodeId={selectedNode.id}
              onSelectNode={setSelectedNodeId}
            />
            <ResearcherPaperPanel selectedNode={selectedNode} />
          </>
        ) : (
          <section className="knowledge-graph-panel researcher-graph-empty">
            <h2>No real publications found</h2>
            <p>Try another title, author, keyword, or DOI.</p>
          </section>
        )}
      </div>
    </ResearcherShell>
  );
}

function SearchFilterPanel({ filters, onChangeFilters, onClearFilters }) {
  const { data: filterSuggestions } = useSearchSuggestions(filters.keyword, 8);
  const keywordChips = filters.keyword
    ? filters.keyword
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : ["Machine Learning", "Neural Networks"];

  return (
    <aside className="search-filter-panel" aria-label="Search filters">
      <div className="search-filter-heading">
        <h2>
          <MiniIcon path="M5 7h14M8 12h8M10 17h4" />
          Filters
        </h2>
        <button type="button" onClick={onClearFilters}>
          Clear All
        </button>
      </div>

      <section className="filter-card">
        <h3>
          <MiniIcon path="M7 4v3M17 4v3M5 8h14M6 6h12v13H6z" />
          Publication Year
        </h3>
        <div className="year-range">
          <input
            type="number"
            value={filters.yearFrom}
            onChange={(event) =>
              onChangeFilters({ yearFrom: event.target.value })
            }
            aria-label="From year"
          />
          <span>-</span>
          <input
            type="number"
            value={filters.yearTo}
            onChange={(event) =>
              onChangeFilters({ yearTo: event.target.value })
            }
            aria-label="To year"
          />
        </div>
      </section>

      <section className="filter-card">
        <h3>
          <MiniIcon path="M5 7c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3ZM5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
          Data Source
        </h3>
        <label>
          <input
            type="radio"
            name="source"
            checked={filters.source === "All Sources"}
            onChange={() => onChangeFilters({ source: "All Sources" })}
          />{" "}
          All Sources
        </label>
        <label>
          <input
            type="radio"
            name="source"
            checked={filters.source === "Google Scholar"}
            onChange={() => onChangeFilters({ source: "Google Scholar" })}
          />{" "}
          Google Scholar
        </label>
        <label>
          <input
            type="radio"
            name="source"
            checked={filters.source === "Semantic Scholar"}
            onChange={() => onChangeFilters({ source: "Semantic Scholar" })}
          />{" "}
          Semantic Scholar
        </label>
        <label>
          <input
            type="radio"
            name="source"
            checked={filters.source === "OpenAlex"}
            onChange={() => onChangeFilters({ source: "OpenAlex" })}
          />{" "}
          OpenAlex
        </label>
        <label>
          <input
            type="radio"
            name="source"
            checked={filters.source === "ResearchGate"}
            onChange={() => onChangeFilters({ source: "ResearchGate" })}
          />{" "}
          ResearchGate
        </label>
        <label>
          <input
            type="radio"
            name="source"
            checked={filters.source === "Crossref"}
            onChange={() => onChangeFilters({ source: "Crossref" })}
          />{" "}
          Crossref
        </label>
        <label title="Relationship graph source seeded from a publication">
          <input
            type="radio"
            name="source"
            checked={filters.source === "Connected Papers"}
            onChange={() => onChangeFilters({ source: "Connected Papers" })}
          />{" "}
          Connected Papers (Graph)
        </label>
      </section>

      <section className="filter-card">
        <h3>Journal &amp; Research Field</h3>
        <input type="search" value={filters.journal} placeholder="Journal name" aria-label="Journal filter" onChange={(event) => onChangeFilters({ journal: event.target.value })} />
        <input type="search" value={filters.researchTopic} placeholder="Research topic or field" aria-label="Research topic filter" onChange={(event) => onChangeFilters({ researchTopic: event.target.value })} />
      </section>

      <section className="filter-card">
        <h3>Citation Range</h3>
        <div className="year-range">
          <input type="number" min="0" value={filters.minCitations} placeholder="Min" aria-label="Minimum citations" onChange={(event) => onChangeFilters({ minCitations: event.target.value })} />
          <span>–</span>
          <input type="number" min="0" value={filters.maxCitations} placeholder="Max" aria-label="Maximum citations" onChange={(event) => onChangeFilters({ maxCitations: event.target.value })} />
        </div>
      </section>

      <section className="filter-card keyword-filter-card">
        <h3>
          <MiniIcon path="M20 13.5 13.5 20 4 10.5V4h6.5l9.5 9.5ZM8 8h.01" />
          Keywords
        </h3>
        <div className="keyword-chips">
          {keywordChips.map((keyword) => (
            <span key={keyword}>
              {keyword}{" "}
              <button
                type="button"
                aria-label={`Remove ${keyword}`}
                onClick={() =>
                  onChangeFilters({
                    keyword: keywordChips
                      .filter((item) => item !== keyword)
                      .join(", "),
                  })
                }
              >
                x
              </button>
            </span>
          ))}
        </div>
        <div className="keyword-entry">
          <MiniIcon path="M11 4a7 7 0 1 0 4.9 12l4.1 4" />
          <input
            type="search"
            value={filters.keyword}
            onChange={(event) =>
              onChangeFilters({ keyword: event.target.value })
            }
            placeholder="Keyword..."
            aria-label="Search keyword filter"
            list="student-search-keyword-suggestions"
          />
          <button
            type="button"
            onClick={() =>
              onChangeFilters({
                keyword: filters.keyword || "Machine Learning",
              })
            }
          >
            <MiniIcon path="M12 5v14M5 12h14" />
            Add
          </button>
          <datalist id="student-search-keyword-suggestions">
            {filterSuggestions.map((suggestion) => (
              <option value={suggestion} key={suggestion} />
            ))}
          </datalist>
        </div>
      </section>
    </aside>
  );
}

function SearchResultCard({ result, onToggleSave, onDownloadPaper }) {
  const detailPath = `/student-publication${result.id ? `?id=${encodeURIComponent(result.id)}` : ""}`;
  const sourceLink = result.externalLinks?.[0];
  return (
    <article className="search-result-card">
      <button
        className={`result-save ${result.saved ? "saved" : ""}`}
        type="button"
        aria-label={
          result.saved ? "Remove saved publication" : "Save publication"
        }
        onClick={() => onToggleSave?.(result)}
      >
        <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
      </button>
      <a
        className="result-title-link"
        href={detailPath}
        onClick={navTo(detailPath)}
      >
        <h2>{result.title}</h2>
      </a>
      <p className="result-authors">{result.authors}</p>
      <p className="result-abstract">{result.abstract}</p>
      {result.externalLinks?.length ? (
        <div className="result-source-links" aria-label="External sources">
          {result.externalLinks.map((link) => (
            <a
              href={link.href}
              key={link.label}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
      <div className="result-meta-row">
        <div className="result-meta">
          <span>
            <MiniIcon path="M7 4v3M17 4v3M5 8h14M6 6h12v13H6z" />
            {result.year}
          </span>
          <span>
            <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
            {result.source}
          </span>
          {result.syncedAt ? (
            <span title="Last metadata synchronization time">
              Synced {new Date(result.syncedAt).toLocaleString()}
            </span>
          ) : null}
          <strong>{result.citations} Citations</strong>
        </div>
        <div className="result-actions">
          <button type="button" onClick={() => onDownloadPaper?.(result)}>
            <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
            Download DOCX
          </button>
          {sourceLink ? (
            <a href={sourceLink.href} target="_blank" rel="noreferrer">
              Open Paper <span aria-hidden="true">-&gt;</span>
            </a>
          ) : (
            <a href={detailPath} onClick={navTo(detailPath)}>
              View Detail <span aria-hidden="true">-&gt;</span>
            </a>
          )}
        </div>
      </div>
      <PublicationReviewPanel publication={result} />
    </article>
  );
}

function PublicationReviewPanel({ publication }) {
  const publicationKey = String(
    publication.doi || publication.id || publication.title,
  ).trim();
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [data, setData] = React.useState({
    averageCredibility: 0,
    reviewCount: 0,
    reviews: [],
  });
  const [status, setStatus] = React.useState("idle");
  const [message, setMessage] = React.useState("");
  const [reviewReactions, setReviewReactions] = React.useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem("scholartrend.reviewReactions") || "{}");
    } catch {
      return {};
    }
  });

  const loadReviews = React.useCallback(async () => {
    if (!publicationKey) return;
    if (!getStoredAuth().accessToken) {
      setStatus("idle");
      return;
    }
    setStatus("loading");
    try {
      const payload = await apiFetch(
        `/api/publication-reviews?publicationKey=${encodeURIComponent(publicationKey)}`,
        { auth: true, __skipClientAlert: true },
      );
      setData(payload);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [publicationKey]);

  React.useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const submitReview = async (event) => {
    event.preventDefault();
    if (!getStoredAuth().accessToken) {
      setMessage("Please sign in to publish a review.");
      return;
    }
    if (!rating) {
      setMessage("Choose a credibility score from 1 to 5.");
      return;
    }
    if (comment.trim().length < 3) {
      setMessage("Write a comment with at least 3 characters.");
      return;
    }
    setStatus("saving");
    try {
      await apiFetch("/api/publication-reviews", {
        method: "POST",
        auth: true,
        body: {
          publicationKey,
          publicationTitle: publication.title,
          publicationAuthors:
            typeof publication.authors === "string"
              ? publication.authors
              : (publication.authors || [])
                  .map((author) => author.name || author.fullName || author)
                  .join(", "),
          publicationAbstract:
            publication.abstract || publication.summary || "",
          publicationSource:
            publication.source ||
            publication.venue ||
            publication.journalName ||
            "",
          publicationYear: Number(publication.year) || null,
          publicationDoi: publication.doi || "",
          publicationUrl:
            publication.externalLinks?.[0]?.href ||
            publication.accessPoints?.[0]?.href ||
            publication.sourceUrl ||
            "",
          credibilityRating: rating,
          comment: comment.trim(),
        },
      });
      setComment("");
      setMessage("Your review is now visible to other users.");
      await loadReviews();
    } catch (error) {
      setStatus("ready");
      setMessage(error.message);
    }
  };

  const reactToReview = (reviewId, reaction) => {
    setReviewReactions((current) => {
      const next = {
        ...current,
        [reviewId]: current[reviewId] === reaction ? null : reaction,
      };
      window.localStorage.setItem(
        "scholartrend.reviewReactions",
        JSON.stringify(next),
      );
      return next;
    });
  };

  return (
    <section className="publication-review-panel">
      <button
        type="button"
        className="review-summary-button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="review-star" aria-hidden="true">★</span>
        <strong>
          {data.reviewCount
            ? `${Number(data.averageCredibility).toFixed(1)}/5 credibility`
            : "Not rated yet"}
        </strong>
        <span>
          {data.reviewCount} {data.reviewCount === 1 ? "review" : "reviews"}
        </span>
        <b>{open ? "Hide" : "View & review"}</b>
      </button>
      {open ? (
        <div className="review-panel-content">
          <form className="review-compose" onSubmit={submitReview}>
            <div>
              <strong>How credible is this paper?</strong>
              <span>Rate the source quality and research reliability.</span>
            </div>
            <div className="credibility-rating" aria-label="Credibility rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  className={value <= rating ? "active" : ""}
                  aria-label={`${value} out of 5`}
                  onClick={() => setRating(value)}
                  key={value}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              maxLength={2000}
              placeholder="Share why you consider this paper credible or what readers should verify..."
              onChange={(event) => setComment(event.target.value)}
            />
            <div className="review-compose-footer">
              <small>{comment.length}/2000</small>
              <button type="submit" disabled={status === "saving"}>
                {status === "saving" ? "Publishing..." : "Publish Review"}
              </button>
            </div>
            {message ? <p>{message}</p> : null}
          </form>
          <div className="review-list">
            {status === "loading" ? <p>Loading reviews...</p> : null}
            {status !== "loading" && !data.reviews?.length ? (
              <p>No comments yet. Be the first reviewer.</p>
            ) : null}
            {(data.reviews || []).map((review) => (
              <article key={review.id}>
                <header>
                  <strong>{review.reviewerName}</strong>
                  <span>{review.reviewerRole}</span>
                  <b>{review.credibilityRating}/5 ★</b>
                </header>
                <p>{review.comment}</p>
                <time>{formatAdminDateTime(review.updatedAt, "")}</time>
                <div className="review-reaction-controls">
                  <button
                    type="button"
                    className={reviewReactions[review.id] === "like" ? "active like" : ""}
                    aria-pressed={reviewReactions[review.id] === "like"}
                    onClick={() => reactToReview(review.id, "like")}
                  >
                    <span aria-hidden="true">👍</span> Like
                  </button>
                  <button
                    type="button"
                    className={reviewReactions[review.id] === "dislike" ? "active dislike" : ""}
                    aria-pressed={reviewReactions[review.id] === "dislike"}
                    onClick={() => reactToReview(review.id, "dislike")}
                  >
                    <span aria-hidden="true">👎</span> Dislike
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { ResearcherSearchTopbar, ResearcherPublicationTopbar, KnowledgeGraphCanvas, ResearcherPaperPanel, listViewPapers, ResearcherListTopbar, ResearcherListDetail, ResearcherListViewPage, ResearcherSearchPage, SearchFilterPanel, SearchResultCard, PublicationReviewPanel };
