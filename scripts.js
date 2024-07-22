require([
  "esri/WebMap",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/layers/ImageryLayer",
  "esri/layers/MapImageLayer",
  "esri/core/reactiveUtils",
  "esri/Graphic",
  "esri/geometry/geometryEngine",
  "esri/layers/GraphicsLayer",
  "esri/widgets/Sketch/SketchViewModel",
  "esri/widgets/DistanceMeasurement2D",
  "esri/widgets/AreaMeasurement2D",
  "esri/widgets/BasemapLayerList",
  "esri/widgets/Bookmarks",
  "esri/widgets/Legend",
], function (
  WebMap,
  MapView,
  FeatureLayer,
  ImageryLayer,
  MapImageLayer,
  reactiveUtils,
  Graphic,
  geometryEngine,
  GraphicsLayer,
  SketchViewModel,
  DistanceMeasurement2D,
  AreaMeasurement2D,
  BasemapLayerList,
  Bookmarks,
  Legend
) {
  const urlParams = new URLSearchParams(window.location.search);
  let currentURL = window.location.href;
  let configUrl = urlParams.get("viewer");

  // Updated regex pattern to allow additional query parameters
  let urlPattern = /\?viewer=cama\/\w+(&\w+=\w+)*$/;

  if (configUrl != null && urlPattern.test(currentURL)) {
    configUrl = configUrl + ".json";
    $("#whole-app").show();
  } else {
    window.location.href = "https://www.qds.biz/gis-service";
  }
  const configVars = {
    mapId: "",
    condoLayer: "",
    title: "",
    isCondosLayer: "",
    noCondoLayer: "",
  };

  fetch(configUrl)
    .then((response) => response.json())
    .then((config) => {
      const layers = config.layers;
      configVars.mapId = config.webmapId || "6448b08504de4244973a28305b18271f";
      configVars.condoLayer = config.condoLayer;
      configVars.noCondoLayer = config.noCondoLayer;
      configVars.title = config.title;
      configVars.isCondosLayer = config.condos;
      configVars.masterTable = config.masterTable;
      configVars.zoom = config.zoom;
      configVars.parcelZoom = config.parcelZoom;
      configVars.imageUrl = config.imageUrl;
      configVars.welcomeImage = config.welcomeImage;
      configVars.pdf_Image = config.pdf_Image;
      configVars.pdf_demo = config.pdf_demographics;
      configVars.taxMap_Url = config.taxMapUrl;
      configVars.parcelMapUrl = config.parcelMapUrl;
      configVars.housingUrl = config.housingUrl;
      configVars.propertyCard = config.propertyCard;
      configVars.tax_bill = config.tax_bill;
      configVars.accessorName = config.accessorName;
      configVars.parcelTitle = config.parcelServiceTitle;
      configVars.tabTitle = config.tabTitle;
      configVars.basemapTitle = config.basemapTitle;
      configVars.parcelRenderer = config.parcelRenderer;
      configVars.useUniqueIdforParcelMap = config.useUniqueIdforParcelMap;
      configVars.helpUrl = config.helpUrl;
      configVars.includeFilter = config.includeFilter;
      document.getElementById("AccessorName").innerHTML = config.accessorName;
      $(".help-url").attr("href", configVars.helpUrl);
      // configVars.homeExtent = config.homeExtent;
      document.getElementById("title").innerHTML = configVars.title;
      document.getElementById("print-title").innerHTML = configVars.title;
      document.getElementById("imageContainer").src = configVars.welcomeImage;
      document.getElementById("print-image").src = configVars.welcomeImage;
      document.getElementById("tab-title").innerHTML = configVars.tabTitle;

      function formatDate(timestamp) {
        var date = new Date(timestamp);
        var day = date.getDate(); // Get the day of the month
        var month = date.getMonth() + 1; // Get the month (0-11, hence add 1)
        var year = date.getFullYear(); // Get the full year
        return month + "/" + day + "/" + year; // Format as "MM/DD/YYYY"
      }

      // Key to check in sessionStorage
      const key = "condos";
      const key2 = "No geometry"; // no condos default

      // Check if the key exists in sessionStorage

      sessionStorage.setItem(key, configVars.isCondosLayer);

      const searchGraphicsLayers = new GraphicsLayer();
      const sketchGL = new GraphicsLayer();

      const webmap = new WebMap({
        portalItem: {
          id: configVars.mapId,
        },
        layers: [searchGraphicsLayers],
      });

      var view = new MapView({
        container: "viewDiv",
        map: webmap,
        units: "imperial",
        zoom: `${configVars.zoom}`,
        popupEnabled: false,
        ui: {
          components: ["attribution"],
        },
        constraints: {
          minScale: 240, // sets the minimum zoom level
          maxScale: 170000, // sets the maximum zoom level
        },
      });
      view.when(() => {
        configVars.homeExtent = view.extent;
      });

      if (configVars.includeFilter === "no") {
        $("#filterButton").remove();
      } else {
      }

      // console.log("extent is", extent);

      view.when(() => {
        if (
          sessionStorage.getItem("agreedToDisclaimer") == "yes" ||
          urlSearchUniqueId == true
        ) {
          $("#starterModal").modal("hide");
        } else {
          $("#starterModal").modal("show");
        }

        $(document).ready(function () {
          $("#agreeBtn").prop("disabled", true);
          $("#agreeCheck").change(function () {
            if ($(this).is(":checked")) {
              $("#agreeBtn").prop("disabled", false);
              sessionStorage.setItem("agreedToDisclaimer", "yes");
              // Perform actions when checkbox is checked
            } else {
              $("#agreeBtn").prop("disabled", true);
              // Perform actions when checkbox is unchecked
            }
          });
        });
      });

      view.when(() => {
        let urlButton = document.getElementById("urlButton");

        urlButton.addEventListener("click", function (event) {
          let urlValue = urlInput.value;

          function addFeatureLayer() {
            let urlInputLayer = new FeatureLayer({
              url: `${urlValue}`,
            });

            // Listen for the load event to handle success and error
            urlInputLayer
              .load()
              .then(() => {
                // Add the layer to the web map
                webmap.add(urlInputLayer);
                $("#urlMessage").html(
                  `<strong><p style="color:green;">Successfully uploaded REST Service.</p></strong>`
                );

                webmap.layers.on("change", function (event) {
                  console.log(event);
                  console.log(event, " layer was added/removed from the map.");
                });

                // Add the newly added layer to the pick list
                var pickListContainer = $("#layerList");
                addLayerToPickList(urlInputLayer, pickListContainer);

                urlInput.value = "";
              })
              .catch((error) => {
                $("#urlMessage").html(
                  `<strong><p style="color:red;">Error uploading REST Service.</p></strong>`
                );
                console.error("Error loading the FeatureLayer:", error);
              });
          }

          if (urlValue.length > 0) {
            addFeatureLayer();
          }
        });
      });

      view.when(() => {
        let urlButton2 = document.getElementById("urlButtonImagery");

        urlButton2.addEventListener("click", function (event) {
          let urlValue = urlInputImagery.value;

          function addImageryLayer() {
            let urlInputLayer = new ImageryLayer({
              url: `${urlValue}`,
            });

            // Listen for the load event to handle success and error
            urlInputLayer
              .load()
              .then(() => {
                // Add the layer to the web map
                webmap.add(urlInputLayer);
                $("#urlMessageImagery").html(
                  `<strong><p style="color:green;">Successfully uploaded REST Service.</p></strong>`
                );

                webmap.layers.on("change", function (event) {
                  console.log(event);
                  console.log(event, " layer was added/removed from the map.");
                });

                // Add the newly added layer to the pick list
                var pickListContainer = $("#layerList");
                addLayerToPickList(urlInputLayer, pickListContainer);

                urlInput.value = "";
              })
              .catch((error) => {
                $("#urlMessageImagery").html(
                  `<strong><p style="color:red;">Error uploading REST Service.</p></strong>`
                );
                console.error("Error loading the FeatureLayer:", error);
              });
          }

          if (urlValue.length > 0) {
            addImageryLayer();
          }
        });
      });

      view.when(() => {
        let urlButton3 = document.getElementById("urlButtonMapService");

        urlButton3.addEventListener("click", function (event) {
          let urlValue = urlInputMapService.value;

          function addMapServiceLayer() {
            let urlInputLayer = new MapImageLayer({
              url: `${urlValue}`,
            });

            // Listen for the load event to handle success and error
            urlInputLayer
              .load()
              .then(() => {
                // Add the layer to the web map
                webmap.add(urlInputLayer);
                $("#urlMessageMapService").html(
                  `<strong><p style="color:green;">Successfully uploaded REST Service.</p></strong>`
                );

                webmap.layers.on("change", function (event) {
                  console.log(event);
                  console.log(event, " layer was added/removed from the map.");
                });

                // Add the newly added layer to the pick list
                var pickListContainer = $("#layerList");
                addLayerToPickList(urlInputLayer, pickListContainer);

                urlInput.value = "";
              })
              .catch((error) => {
                $("#urlMessageMapService").html(
                  `<strong><p style="color:red;">Error uploading REST Service.</p></strong>`
                );
                console.error("Error loading the FeatureLayer:", error);
              });
          }

          if (urlValue.length > 0) {
            addMapServiceLayer();
          }
        });
      });

      view.when(() => {
        // Filter out layers belonging to the "hidden group" and layers with a specific title "Do Not Show"
        const visibleLayers = webmap.layers.items.filter((layer) => {
          return !(
            (layer.type === "group" &&
              layer.title &&
              layer.title.toLowerCase() === "hidden group") ||
            (layer.title && layer.title === `${configVars.parcelTitle}`)
          );
        });

        // Create legend with filtered layers
        const legend = new Legend({
          view: view,
          container: $("#LegendDiv")[0],
          layerInfos: visibleLayers.map((layer) => {
            return { layer: layer };
          }),
        });
      });

      // let basemapDiv = $("#BookmarksDiv");

      view.when(() => {
        const bookmarks = new Bookmarks({
          view: view,
          container: $("#BookmarksDiv")[0],
          // allows bookmarks to be added, edited, or deleted
          dragEnabled: true,
        });
      });

      // view.when(() => {
      //   const print = new Print({
      //     view: view,
      //     container: $("#PrintDiv")[0],
      //     templateOptions: {
      //       scaleEnabled: false,
      //     },
      //     allowedLayouts: [
      //       "letter-ansi-a-landscape",
      //       "letter-ansi-a-portrait",
      //       "tabloid-ansi-b-landscape",
      //       "tabloid-ansi-b-portrait",
      //       "a3-landscape",
      //       "a3-portrait",
      //       "a4-landscape",
      //       "a4-portrait",
      //     ],
      //   });
      // });
      view.when(() => {
        const basemaps = new BasemapLayerList({
          view: view,
          container: $("#BasemapDiv")[0],
          dragEnabled: true,
        });

        basemaps.visibleElements = {
          statusIndicators: true,
          baseLayers: true,
          referenceLayers: false,
          referenceLayersTitle: false,
          errors: true,
          heading: false,
        };

        let originalRenderer;
        let newRenderer = {
          type: "simple",
          symbol: {
            type: "simple-fill",
            color: [255, 255, 255, 0.0],
            outline: {
              width: 1,
              color: `${configVars.parcelRenderer}`,
            },
          },
        };

        let OG = {
          type: "simple",
          symbol: {
            type: "simple-fill",
            color: [255, 255, 255, 0.0],
            outline: {
              width: 1,
              color: "#897044",
            },
          },
        };

        view.map.allLayers.forEach((layer) => {
          if (layer.title === "Parcel Boundaries") {
            originalRenderer = layer.renderer;
          }
        });

        // Check visibility of ortho layers at the start
        const orthoLayers = [
          "Aerial-Ortho 2019",
          "Aerial-Ortho 2016",
          "Aerial-Ortho 2012",
        ];
        let anyOrthoVisible = view.map.allLayers.some(
          (layer) => orthoLayers.includes(layer.title) && layer.visible
        );

        if (anyOrthoVisible) {
          view.map.allLayers.forEach((layer) => {
            if (layer.title === "Parcel Boundaries") {
              layer.renderer = newRenderer;
            }
          });
        }

        if (sessionStorage.getItem("condos") === "yes") {
          originalRenderer = CondosLayer.renderer;
        } else {
          originalRenderer = noCondosLayer.renderer;
        }

        // Initialize visibility tracking
        const layerVisibility = {};
        view.map.basemap.baseLayers.forEach((layer) => {
          layerVisibility[layer.id] = layer.visible;
        });

        reactiveUtils.watch(
          () => view.map.basemap.baseLayers.map((layer) => layer.visible),
          () => {
            console.log(
              "Visibility changed:",
              view.map.basemap.baseLayers.map((layer) => ({
                title: layer.title,
                visible: layer.visible,
              }))
            );
            manageBasemapVisibility(
              view.map.basemap.baseLayers,
              layerVisibility
            );
          }
        );

        function manageBasemapVisibility(baseLayers, visibilityTracker) {
          let newlyVisibleLayer = baseLayers.find(
            (layer) => layer.visible && !visibilityTracker[layer.id]
          );

          if (newlyVisibleLayer) {
            console.log(`Newly visible layer: ${newlyVisibleLayer.title}`);
            baseLayers.forEach((layer) => {
              if (layer !== newlyVisibleLayer) {
                layer.visible = false;
              }
            });

            if (
              newlyVisibleLayer.title !== `${configVars.basemapTitle}` &&
              newlyVisibleLayer.title !== "Washington Basemap"
            ) {
              if (sessionStorage.getItem("condos") === "yes") {
                CondosLayer.renderer = newRenderer;
              } else {
                noCondosLayer.renderer = newRenderer;
              }
            } else {
              // Revert to the original renderer if the basemap is the configured basemap title or "Washington Basemap"
              view.map.allLayers.forEach((layer) => {
                if (layer.title === "Parcel Boundaries") {
                  layer.renderer = OG;
                }
              });
            }
          } else {
            // Prevent all basemaps from being deselected
            let visibleLayers = baseLayers.filter((layer) => layer.visible);
            if (visibleLayers.length === 0) {
              // If no layers are visible, revert the change
              baseLayers.forEach((layer) => {
                layer.visible = visibilityTracker[layer.id];
              });
              alert("At least one basemap must be visible.");
            }
          }

          // Update visibility tracker
          baseLayers.forEach((layer) => {
            visibilityTracker[layer.id] = layer.visible;
          });

          console.log(
            "Updated visibility tracker:",
            baseLayers.map((layer) => ({
              title: layer.title,
              wasVisible: visibilityTracker[layer.id],
            }))
          );
        }
      });

      webmap.add(sketchGL);
      let urlSearchUniqueId;
      let scaleBar;
      let runQuerySearchTerm;
      let clickedToggle;
      let detailSelected = [];
      let firstList = [];
      let detailsGeometry;
      let CondoBuffer = false;
      let targetExtent;
      let queryUnits = "feet";
      let exportResults;
      let uniqueArray;
      let highlightResponse;
      let searchResults;
      let lasso = false;
      let select = false;
      let bufferGraphicId;
      let polygonGraphics;
      let noCondosParcelGeom;
      let isGisLink;
      let isClickEvent = false;
      let detailsChanged = {
        isChanged: false,
        item: "",
      };
      let DetailsHandle;
      let clickHandle;
      let removeFromList;
      let regSearch = false;

      let value = document.getElementById("buffer-value");
      const clearBtn1 = document.getElementById("clear-btn1");
      const clearBtn2 = document.getElementById("clear-btn2");

      let oldExtent = view.extent;
      let oldScale = view.scale;
      let oldZoom = view.zoom;
      let valueToRemove;
      let handleUsed;
      let detailsHandleUsed;
      let exportCsv;
      let queryValues = [];
      let zoomToItemId;
      let zoomToObjectID;
      let overRide;

      // scaleBar = new ScaleBar({
      //   view: view,
      //   style: "ruler",
      //   unit: "imperial",
      //   container: document.createElement("div"),
      // });

      // view.ui.add(scaleBar, {
      //   position: "bottom-right",
      // });

      reactiveUtils.watch(
        () => [view.zoom, view.extent, view.scale],
        ([zoom, extent, scale], [wasStationary]) => {
          // configVars.homeExtent = extent;
          // console.log("extent is", extent);
          if (zoom) {
            if (zoom !== oldZoom) {
              oldZoom = zoom;
              // console.log(`old zoom is: ${oldZoom} and new ${zoom}`);
            }

            if (!noCondosLayer.visible && !CondosLayer.visible) {
              if (Number(zoom) > configVars.parcelZoom) {
                if (sessionStorage.getItem("condos") === "no") {
                  noCondosLayer.visible = true;
                } else {
                  CondosLayer.visible = true;
                }

                if (DetailsHandle) {
                  DetailsHandle?.remove();
                  DetailsHandle = null;
                }
                if (clickHandle) {
                  clickHandle?.remove();
                  clickHandle = null;
                }

                if (
                  handleUsed == "click" ||
                  handleUsed == "details" ||
                  handleUsed == "none yet"
                ) {
                  $("#select-button").removeClass("btn-warning");
                  return;
                } else {
                  clickHandle = view.on("click", handleClick);
                  $("#lasso").removeClass("btn-warning");
                  $("#select-button").addClass("btn-warning");
                  select = true;
                }
              }
            }
          } else if (wasStationary) {
            oldExtent = extent;
            oldScale = scale;
            oldZoom = zoom;
          }
          return "";
        }
      );

      let measureContainer = document.getElementById("topbar");
      view.ui.add(measureContainer, "bottom-right");

      let activeWidget1 = null;
      document
        .getElementById("distanceButton")
        .addEventListener("click", function () {
          setActiveWidget(null);
          if (!this.classList.contains("active")) {
            setActiveWidget("distance");
            // $("#distanceButton").addClass("btn-warning");
          } else {
            setActiveButton(null);
            // $("#distanceButton").removeClass("btn-warning");
          }
        });

      document
        .getElementById("areaButton")
        .addEventListener("click", function () {
          setActiveWidget(null);
          if (!this.classList.contains("active")) {
            setActiveWidget("area");
            // $("#areaButton").addClass("btn-warning");
          } else {
            setActiveButton(null);
            // $("#areaButton").removeClass("btn-warning");
          }
        });

      function setActiveWidget(type) {
        switch (type) {
          case "distance":
            activeWidget1 = new DistanceMeasurement2D({
              view: view,
              unit: "feet",
            });
            // skip the initial 'new measurement' button
            activeWidget1.viewModel.start();

            if (!DetailsHandle && !clickHandle) {
              handleUsed = "none yet";
            }

            if (DetailsHandle) {
              try {
                handleUsed = "details";
                DetailsHandle?.remove();
                DetailsHandle = null;
              } catch (error) {
                console.error("Failed to remove DetailsHandle", error);
              }
            }

            if (clickHandle) {
              try {
                handleUsed = "click";
                clickHandle.remove();
                // console.log(handleUsed);
              } catch (error) {
                console.error("Failed to remove DetailsHandle", error);
              }
            }

            // if (handleUsed == "details") {
            //   handleUsed = "details";
            // } else {
            //   handleUsed = "click";
            // }

            // handleUsed = "none yet";

            if (activeWidget1 && activeWidget1.viewModel) {
              // Listen for the "measure-end" event on the viewModel
              activeWidget1.viewModel.watch("state", function (state) {
                if (state === "measured") {
                  if (handleUsed == "click") {
                    clickHandle = view.on("click", handleClick);
                  } else if (handleUsed == "details") {
                    DetailsHandle = view.on("click", handleDetailsClick);
                    detailsHandleUsed == "";
                  } else {
                  }
                  // The measurement is complete
                  // console.log("Measurement completed");

                  // Your custom logic here
                  // For example, you could display the measurement result in a custom UI element,
                  // log it, or store it for further processing.
                }
              });
            }

            view.ui.add(activeWidget1, "bottom-right");
            setActiveButton(document.getElementById("distanceButton"));
            break;
          case "area":
            activeWidget1 = new AreaMeasurement2D({
              view: view,
              unit: "square-us-feet",
            });

            activeWidget1.viewModel.start();

            if (!DetailsHandle && !clickHandle) {
              handleUsed = "none yet";
            }
            if (DetailsHandle) {
              try {
                handleUsed = "details";
                DetailsHandle?.remove();
                DetailsHandle = null;
              } catch (error) {
                console.error("Failed to remove DetailsHandle", error);
              }
            }

            if (clickHandle) {
              try {
                handleUsed = "click";
                clickHandle?.remove();
                clickHandle = null;
              } catch (error) {
                console.error("Failed to remove DetailsHandle", error);
              }
            }

            // if (handleUsed == "details") {
            //   handleUsed = "details";
            // } else {
            //   handleUsed = "click";
            // }

            // handleUsed = "none yet";

            // Assuming activeWidget1 is an instance of DistanceMeasurement2D or AreaMeasurement2D
            if (activeWidget1 && activeWidget1.viewModel) {
              // Listen for the "measure-end" event on the viewModel
              activeWidget1.viewModel.watch("state", function (state) {
                if (state === "measured") {
                  if (handleUsed == "click") {
                    clickHandle = view.on("click", handleClick);
                  } else if (handleUsed == "details") {
                    DetailsHandle = view.on("click", handleDetailsClick);
                    detailsHandleUsed == "";
                  } else {
                  }
                  // The measurement is complete
                  // console.log("Measurement completed");

                  // Your custom logic here
                  // For example, you could display the measurement result in a custom UI element,
                  // log it, or store it for further processing.
                }
              });
            }
            // detailsHandleUsed == "";
            view.ui.add(activeWidget1, "bottom-right");

            setActiveButton(document.getElementById("areaButton"));
            break;
          case null:
            if (activeWidget1) {
              view.ui.remove(activeWidget1);
              activeWidget1.destroy();
              activeWidget1 = null;
              detailsHandleUsed == "";
            }
            break;
        }
      }

      function setActiveButton(selectedButton) {
        // focus the view to activate keyboard shortcuts for sketching
        view.focus();
        // detailsHandleUsed == "";
        let elements = Array.from(document.getElementsByClassName("active"));
        for (let i = 0; i < elements.length; i++) {
          elements[i].classList.remove("active", "btn-warning");
          // elements[i].classList.remove("btn-warning");
          elements[i].classList.add("bg-info");
        }
        if (selectedButton) {
          selectedButton.classList.add("active", "btn-warning");
          selectedButton.classList.remove("bg-info");
          // selectedButton.classList.add("btn-warning");
        }
      }

      // // Check if the key exists in sessionStorage
      // if (sessionStorage.getItem(key) === null) {
      //   // If the key doesn't exist, set it to "none"
      //   sessionStorage.setItem(key, configVars.isCondosLayer);
      // }

      let noCondosLayer = new FeatureLayer({
        url: `${configVars.noCondoLayer}`,
        visible: false,
        popupEnabled: true,
        title: "Parcel Boundaries",
        id: "noCondoLayer",
      });

      // noCondosLayer.renderer = {
      //   type: "simple",
      //   symbol: {
      //     type: "simple-fill",
      //     color: [255, 255, 255, 0],
      //     outline: {
      //       width: 1,
      //       color: [169, 169, 169, 1],
      //     },
      //   },
      // };

      let CondosLayer = new FeatureLayer({
        url: `${configVars.condoLayer}`,
        visible: false,
        popupEnabled: true,
        title: "Parcel Boundaries",
        id: "condoLayer",
      });

      // CondosLayer.renderer = {
      //   type: "simple", // autocasts as new SimpleRenderer()
      //   symbol: {
      //     type: "simple-fill", // autocasts as new SimpleMarkerSymbol()
      //     color: [255, 255, 255, 0],
      //     outline: {
      //       // autocasts as new SimpleLineSymbol()
      //       width: 1,
      //       color: [169, 169, 169, 1],
      //     },
      //   },
      // };

      const CondosTable = new FeatureLayer({
        url: `${configVars.masterTable}`,
      });

      const noCondosTable = new FeatureLayer({
        url: `${configVars.masterTable}`,
      });

      webmap.add(noCondosLayer);
      webmap.add(CondosLayer);

      CondosTable.load().then(() => {
        webmap.tables.add(CondosTable);
      });
      noCondosTable.load().then(() => {
        webmap.tables.add(noCondosTable);
      });

      view.when(function () {
        let watchLayer;
        // Assuming the icon is initially set to "plus" for all items
        if (sessionStorage.getItem("condos") === "yes") {
          watchLayer = "condoLayer";
        } else {
          watchLayer = "noCondoLayer";
        }

        // Assuming webmap is already defined
        // Find the specific layer by its id or name
        var specificLayer = webmap.layers.find(
          (layer) => layer.id === watchLayer
        );

        // Check if the specific layer was found
        // if (specificLayer) {
        reactiveUtils.watch(
          () => specificLayer.visible,
          () => {
            let isVisible = specificLayer.visible;
            updateLayerUI(specificLayer.id, isVisible);
          }
        );
        // Watch for visibility changes on the specific layer
        // reactiveUtils.watch(specificLayer, "visible", function (isVisible) {
        //   // Update UI based on the layer's visibility
        //   updateLayerUI(specificLayer.id, isVisible);
        // });
        // } else {
        //   console.error("Layer not found.");
        // }
      });

      function updateLayerUI(layerId, isVisible) {
        // Find the corresponding UI element in the pick list
        let actionElement = $(
          `calcite-pick-list-item[value="${layerId}"] calcite-action`
        );

        // Toggle the icon based on visibility
        if (isVisible) {
          actionElement.attr("icon", "check-square"); // Assuming you use 'check' icon for visible
        } else {
          actionElement.attr("icon", "square"); // Use an appropriate icon for non-visible
        }
      }

      // Updated function to add a layer to the pick list with click event handling
      function addLayerToPickList(layer, container) {
        let turnLayerOff;
        // Assuming the icon is initially set to "plus" for all items
        if (sessionStorage.getItem("condos") === "yes") {
          turnLayerOff = "noCondoLayer";
        } else {
          turnLayerOff = "condoLayer";
        }

        if (
          layer.type === "graphics" ||
          layer.title == "Tax Map Annotation" ||
          layer.title == "Road Centerline" ||
          layer.title == null ||
          layer.title == "" ||
          layer.id == turnLayerOff
        ) {
          return;
        } else {
          var icon;

          layer.visible ? (icon = "check-square") : (icon = "square");
          // var icon = "square";

          // Create the pick list item and action for each layer
          var item =
            $(`<calcite-pick-list-item scale="m" label="${layer.title}" value="${layer.id}" description="${layer.type}">
      <calcite-action id="action-${layer.id}" slot="actions-end" icon="${icon}" text="${layer.title}"></calcite-action>
    </calcite-pick-list-item>`);

          // Append the item to the specified container
          container.append(item);

          // Add click event listener for the action
          // $(`#action-${layer.id}`).on("click", function () {
          //   // Toggle visibility
          //   layer.visible = !layer.visible;

          //   // Swap the icon based on the new visibility state
          //   var newIcon = layer.visible ? "minus" : "plus";
          //   $(this).attr("icon", newIcon);

          // });
        }
      }

      function processLayers(layers, container) {
        layers.forEach(function (layer) {
          if (layer.type === "group") {
            // Check if the group layer is named "hidden group"
            if (layer.title && layer.title.toLowerCase() === "hidden group") {
              // Skip processing this layer and its sublayers
              return;
            }

            // For group layers, create a calcite-accordion-item
            var groupTitle = layer.title || "Industry"; // Default title or layer title
            var accordionItem = $(`
              <calcite-accordion scale="m">
                <calcite-accordion-item heading="${groupTitle}">
                </calcite-accordion-item>
              </calcite-accordion>`);

            // Recursively process sublayers, adding them as pick list items
            processLayers(
              layer.layers.items,
              accordionItem.find("calcite-accordion-item")
            );

            // Append the accordion item to the main container
            container.append(accordionItem);
          } else {
            // For non-group layers, add them as pick list items
            addLayerToPickList(layer, container);
          }
        });
      }

      function toggleLayerVisibility(layerId, actionElement) {
        // Find the layer in the webmap
        let layer = webmap.findLayerById(layerId);

        if (layer) {
          // Toggle the layer's visibility
          layer.visible = !layer.visible;

          // If the layer is part of a group layer, you might need to toggle each sublayer
          if (layer.type === "group") {
            layer.layers.forEach((subLayer) => {
              subLayer.visible = layer.visible;
            });
          }

          // Update the action icon based on the new visibility state
          actionElement.attr("icon", layer.visible ? "check-square" : "square");

          // Optionally, refresh the layer or the view if necessary
          // view.refresh(); // Uncomment if needed
        }
      }

      $("#layerList").on("click", "calcite-action", function (event) {
        // Prevent the default action
        event.preventDefault();

        // Get the layer ID stored in the value of the pick-list-item
        let layerId = $(this).closest("calcite-pick-list-item").attr("value");

        // Toggle the layer visibility and icon
        toggleLayerVisibility(layerId, $(this));
      });

      // Assuming your webmap is loaded and the view is ready
      view.when(function () {
        // Assuming you have a <calcite-pick-list> with an id="layerList"
        var pickListContainer = $("#layerList");

        // Get the layers from the webmap, might be different based on your actual map setup
        var layers = webmap.layers.items; // Assuming webmap is your WebMap instance

        // Process each layer and add it to the pick list
        processLayers(layers, pickListContainer);
      });

      function overRideSelect(bool) {
        overRide = bool;
      }

      function generateFilters() {
        let query = noCondosLayer.createQuery();
        query.where = `1=1 AND Street_Name IS NOT NULL`;
        query.returnDistinctValues = true;
        query.returnGeometry = false;
        query.orderByFields = ["Street_Name ASC"]; // Adjust based on your needs
        query.outFields = ["Street_Name"];

        CondosLayer.queryFeatures(query).then(function (response) {
          var features = response.features;
          var comboBox = $("#streetFilter");

          // let streetFilteEle = $("#streetFilter");
          features.forEach(function (feature) {
            var name = feature.attributes.Street_Name; // Assuming 'Name' is the field you want to display
            // var id = feature.attributes.OBJECTID; // Assuming 'Id' is the value you want to use

            // Create a new Calcite ComboBox item
            var newItem;
            if (name == "" || null || undefined) {
              return;
            } else {
              // Create a new Calcite ComboBox item
              newItem = $(
                '<calcite-combobox-item value="' +
                  name +
                  '" text-label="' +
                  name +
                  '"></calcite-combobox-item>'
              );
            }

            // Append the new item to the ComboBox
            comboBox.append(newItem);
          });
        });

        let query2 = noCondosLayer.createQuery();
        query2.where = `1=1 AND Owner IS NOT NULL`;
        query2.returnDistinctValues = true;
        query2.returnGeometry = false; // Adjust based on your needs
        query2.outFields = ["Owner"];

        CondosLayer.queryFeatures(query2).then(function (response) {
          var features = response.features;
          var comboBox = $("#ownerFilter");

          // let streetFilteEle = $("#streetFilter");
          features.forEach(function (feature) {
            var name = feature.attributes.Owner; // Assuming 'Name' is the field you want to display
            // var id = feature.attributes.OBJECTID; // Assuming 'Id' is the value you want to use

            var newItem;
            if (name == "" || null || undefined) {
              return;
            } else {
              // Create a new Calcite ComboBox item
              newItem = $(
                '<calcite-combobox-item value="' +
                  name +
                  '" text-label="' +
                  name +
                  '"></calcite-combobox-item>'
              );
            }

            // Append the new item to the ComboBox
            comboBox.append(newItem);
          });
        });

        let query3 = noCondosLayer.createQuery();
        query3.where = `1=1 AND Parcel_Type IS NOT NULL`;
        query3.returnDistinctValues = true;
        query3.returnGeometry = false;
        query3.orderByFields = ["Parcel_Type ASC"]; // Adjust based on your needs
        query3.outFields = ["Parcel_Type"];

        CondosLayer.queryFeatures(query3).then(function (response) {
          // console.log(response);

          var features = response.features;
          var comboBox = $("#propertyFilter");

          features.forEach(function (feature) {
            var name = feature.attributes.Parcel_Type; // Assuming 'Name' is the field you want to display
            var newItem;
            if (name == "" || null || undefined) {
              return;
            } else {
              // Create a new Calcite ComboBox item
              newItem = $(
                '<calcite-combobox-item value="' +
                  name +
                  '" text-label="' +
                  name +
                  '"></calcite-combobox-item>'
              );
            }

            // Append the new item to the ComboBox
            comboBox.append(newItem);
          });
        });

        let query4 = noCondosLayer.createQuery();
        query4.where = `1=1 AND Building_Type IS NOT NULL`;
        query4.returnDistinctValues = true;
        query4.returnGeometry = false; // Adjust based on your needs
        query4.outFields = ["Building_Type"];

        CondosLayer.queryFeatures(query4).then(function (response) {
          var features = response.features;
          var comboBox = $("#buildingFilter");

          features.forEach(function (feature) {
            var name = feature.attributes.Building_Type; // Assuming 'Name' is the field you want to display
            // Create a new Calcite ComboBox item
            var newItem;
            if (name == "" || null || undefined) {
              return;
            } else {
              // Create a new Calcite ComboBox item
              newItem = $(
                '<calcite-combobox-item value="' +
                  name +
                  '" text-label="' +
                  name +
                  '"></calcite-combobox-item>'
              );
            }

            // Append the new item to the ComboBox
            comboBox.append(newItem);
          });
        });

        let query5 = noCondosLayer.createQuery();
        query5.where = `1=1 AND Building_Use_Code IS NOT NULL`;
        query5.returnDistinctValues = true;
        query5.returnGeometry = false; // Adjust based on your needs
        query5.outFields = ["Building_Use_Code"];

        CondosLayer.queryFeatures(query5).then(function (response) {
          var features = response.features;
          var comboBox = $("#buildingUseFilter");

          features.forEach(function (feature) {
            var name = feature.attributes.Building_Use_Code; // Assuming 'Name' is the field you want to display
            var newItem;
            if (name == "" || null || undefined) {
              return;
            } else {
              // Create a new Calcite ComboBox item
              newItem = $(
                '<calcite-combobox-item value="' +
                  name +
                  '" text-label="' +
                  name +
                  '"></calcite-combobox-item>'
              );
            }

            // Append the new item to the ComboBox
            comboBox.append(newItem);
          });
        });

        let query6 = noCondosLayer.createQuery();
        query6.where = `1=1 AND Design_Type IS NOT NULL`;
        query6.returnDistinctValues = true;
        query6.returnGeometry = false; // Adjust based on your needs
        query6.outFields = ["Design_Type"];

        CondosLayer.queryFeatures(query6).then(function (response) {
          var features = response.features;
          var comboBox = $("#designTypeFilter");

          // let streetFilteEle = $("#streetFilter");
          features.forEach(function (feature) {
            var name = feature.attributes.Design_Type; // Assuming 'Name' is the field you want to display
            // var id = feature.attributes.OBJECTID; // Assuming 'Id' is the value you want to use

            var newItem;
            if (name == "" || null || undefined) {
              return;
            } else {
              // Create a new Calcite ComboBox item
              newItem = $(
                '<calcite-combobox-item value="' +
                  name +
                  '" text-label="' +
                  name +
                  '"></calcite-combobox-item>'
              );
            }

            // Append the new item to the ComboBox
            comboBox.append(newItem);
          });
        });

        let query7 = noCondosLayer.createQuery();
        query7.where = `1=1 AND Zoning IS NOT NULL`;
        query7.returnDistinctValues = true;
        query7.returnGeometry = false; // Adjust based on your needs
        query7.outFields = ["Zoning"];

        CondosLayer.queryFeatures(query7).then(function (response) {
          var features = response.features;
          var comboBox = $("#zoningFilter");

          features.forEach(function (feature) {
            var name = feature.attributes.Zoning; // Assuming 'Name' is the field you want to display
            var newItem;
            if (name == "" || null || undefined) {
              return;
            } else {
              // Create a new Calcite ComboBox item
              newItem = $(
                '<calcite-combobox-item value="' +
                  name +
                  '" text-label="' +
                  name +
                  '"></calcite-combobox-item>'
              );
            }

            // Append the new item to the ComboBox
            comboBox.append(newItem);
          });
        });

        let query8 = noCondosLayer.createQuery();
        query8.where = `1=1 AND Neighborhood IS NOT NULL`;
        query8.returnDistinctValues = true;
        query8.returnGeometry = false; // Adjust based on your needs
        query8.outFields = ["Neighborhood"];

        CondosLayer.queryFeatures(query8).then(function (response) {
          var features = response.features;
          var comboBox = $("#neighborhoodFilter");

          features.forEach(function (feature) {
            var name = feature.attributes.Neighborhood; // Assuming 'Name' is the field you want to display
            var newItem;
            if (name == "" || null || undefined) {
              return;
            } else {
              // Create a new Calcite ComboBox item
              newItem = $(
                '<calcite-combobox-item value="' +
                  name +
                  '" text-label="' +
                  name +
                  '"></calcite-combobox-item>'
              );
            }

            // Append the new item to the ComboBox
            comboBox.append(newItem);
          });
        });
      }

      generateFilters();
      document
        .getElementById("Print-selector")
        .addEventListener("click", function () {
          captureMap();
        });

      function captureMap() {
        const printDPI = 300; // Standard print DPI
        const pageWidthInInches = 8.5; // Width of the paper in inches
        const pageHeightInInches = 11; // Height of the paper in inches
        const mapWidthInInches = 8; // Slightly reduced width of the map on paper in inches
        const mapHeightInInches = 6.5; // Slightly reduced height of the map on paper in inches
        const mapWidthInPixels = mapWidthInInches * printDPI;
        const mapHeightInPixels = mapHeightInInches * printDPI;

        view
          .takeScreenshot({
            width: mapWidthInPixels,
            height: mapHeightInPixels,
          })
          .then(function (screenshot) {
            const title = "Map Title"; // Set your dynamic title here
            const printWindow = window.open("", "_blank");
            const scaleBar1 = document.getElementById("scale-value");
            const scaleBarHTML = scaleBar1.innerHTML;
            const currentDate = new Date().toLocaleString();

            printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Print Map</title>
                <link rel="stylesheet" href="https://js.arcgis.com/4.27/esri/themes/light/main.css">
                <style>
                    body {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        margin: 0;
                        padding: 0;
                    }
                    .print-title {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        font-size: 24px;
                        margin: 20px 0;
                    }
                    .print-scale {
                        display: flex;
                        align-items: center;
                        justify-content: space-around;
                        text-align: center;
                        font-size: 14px;
                        width: 100%;
                        margin-left: 40px;
                        margin-right: 40px;
                    }
                    .print-title img {
                        margin-right: 20px;
                    }
                    .scale-bar-container {
                        transform: scale(1.5);
                        margin-right: 50px;
                    }
                    .print-scale-bar {
                        width: 300px;
                        height: 30px;
                    }
                    .info-writing-container {
                        display: flex;
                        justify-content: center;
                        align-items: flex-start;
                        width: 80%;
                        margin: 20px auto;
                    }
                    .info-text {
                        width: 20%;
                        text-align: left;
                        margin-right: 20px;
                    }
                    .writing-lines {
                        width: 80%;
                        text-align: center;
                    }
                    .writing-lines div {
                        border-bottom: 1px solid black;
                        margin: 10px 0;
                        height: 20px;
                    }
                    @media print {
                        body * {
                            visibility: visible;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="print-title" id="print-title">
                    <img id="town-logo" src="${configVars.welcomeImage}" alt="Town Logo">
                    <h1 id="title-text">${configVars.title}</h1>
                </div>
                <div class="print-map">
                    <img id="print-map-image" src="${screenshot.dataUrl}" alt="Map Image" style="width: ${mapWidthInInches}in; height: auto; border: 1.5px solid #A9A9A9; margin: 0 0.75in;">
                </div>
                <div class="print-scale">
                    <div class="print-date" style="font-size: 14px;">Date Printed: ${currentDate}</div>
                    <div id="to-scale" class="scale-bar-container"></div>
                    <div id="print-scale-bar" class="scale-bar-container">${scaleBarHTML}</div>
                </div>
                <div style="text-align: center;">
                    <p>Disclaimer: This map is intended for reference and general informational purposes
                    only and is not a legally recorded map or survey. While reasonable effort has been
                    made to ensure the accuracy, correctness, and timeliness of materials presented,
                    the map vendor and the municipality disclaim any and all liability and responsibility for
                    any errors, omissions, or inaccuracies in the data provided, including without limitation
                    any liability for direct, indirect, incidental, consequential, special, exemplary,
                    punitive, or any other type of damages. Users are hereby notified that the primary
                    information source should be consulted for verification of the data contained herein.
                    Continued use of this map acknowledges acceptance of these terms.</p>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
          `);
            printWindow.document.close();
          });
      }

      function clearContents(e, string) {
        const currentUrl = window.location.href;
        const newUrl = removeQueryParam("uniqueid", currentUrl);
        window.history.pushState({ path: newUrl }, "", newUrl);
        // console.log(e.target.value);
        if (sessionStorage.getItem("condos") === "no") {
          noCondosLayer.visible = true;
        } else {
          CondosLayer.visible = true;
        }
        if (DetailsHandle) {
          try {
            DetailsHandle?.remove();
            DetailsHandle = null;
          } catch (error) {
            console.error("Failed to remove DetailsHandle", error);
          }
        }

        if (clickHandle) {
          try {
            clickHandle?.remove();
            clickHandle = null;
          } catch (error) {
            console.error("Failed to remove DetailsHandle", error);
          }
        }

        handleUsed = "";

        if (select) {
          overRideSelect(true);
        } else {
          overRideSelect(false);
        }

        // $("#scale-value").val("").html("Select Scale");

        // clickHandle = view.on("click", handleClick);
        //$("#lasso").removeClass("btn-warning");
        $("#select-button").removeClass("btn-warning");
        // select = false;
        // lasso = false;

        $("#select-button").addClass("btn-warning");
        clickHandle = view.on("click", handleClick);
        select = true;
        lasso = false;
        $("#searchInput ul").remove();
        $("#searchInput").val = "";
        $("#select-button").prop("disabled", false);
        // $("#side-Exp2").addClass("disabled");

        // Get a reference to the search input field
        const searchInput = document.getElementById("searchInput");

        // To clear the text in the input field, set its value to an empty string
        searchInput.value = "";
        runQuerySearchTerm = "";
        searchTerm = "";
        firstList = [];
        secondList = [];
        zoomToObjectID = "";
        $(".spinner-container").hide();
        $("#distanceButton").removeClass("active");
        $("#areaButton").removeClass("active");
        $("#result-btns").hide();
        $("#details-btns").hide();
        $("#abut-mail").hide();
        $("#dropdown").toggleClass("expanded");
        $("#dropdown").hide();
        $("#results-div").css("left", "0px");
        $("#sidebar2").css("left", "-350px");
        $("#sidebar2").removeClass("collapsed");
        $("#right-arrow-2").show();
        $("#left-arrow-2").hide();
        $("#abutters-content").hide();
        $("#selected-feature").empty();
        $("#parcel-feature").empty();
        $("#backButton").hide();
        $("#exportResults").hide();
        $("#csvExportResults").hide();
        $("#csvExportSearch").hide();
        $("#exportSearch").hide();
        $("#total-results").hide();
        $("#ResultDiv").hide();
        $("#featureWid").hide();
        $("#exportButtons").hide();
        $("#layerListDiv").hide();
        $("#detailBox").hide();
        $("#filterDiv").hide();
        $("#dropdown").show();
        $("#WelcomeBox").show();
        $("#select-button").attr("title", "Add to Selection Enabled");
        $(".center-container").show();

        let suggestionsContainer = document.getElementById("suggestions");
        suggestionsContainer.innerHTML = "";

        $("#distanceButton").removeClass("btn-warning");
        $("#distanceButton").addClass("bg-info");
        $("#areaButton").removeClass("btn-warning");
        $("#distanceButton").addClass("bg-info");
        $("#featureWid").empty();

        view.ui.remove(activeWidget1);
        if (activeWidget1) {
          activeWidget1.destroy();
          activeWidget1 = null;
        }

        detailsHandleUsed == "";
        view.graphics.removeAll();
        polygonGraphics = [];
      }

      $(document).ready(function () {
        // Add click event listener to the dynamically generated buttons with class 'justRemove'
        $(document).on("click", ".justRemove", function (event) {
          event.stopPropagation();
          event.preventDefault();

          let targetElement = event.target.closest("li");
          let itemId = targetElement.getAttribute("data-id");
          let objectID = targetElement.getAttribute("object-id");

          let capturedEvent = event;
          let ClickEvent = true;

          if (sessionStorage.getItem("condos") === "no") {
            let query = CondosLayer.createQuery();
            query.where = `OBJECTID = ${objectID}`;
            query.returnGeometry = true;
            query.outFields = ["*"];

            noCondosLayer.queryFeatures(query).then(function (response) {
              totalResults = response.features;
              processFeatures(totalResults, "", capturedEvent);
              addPolygons(response, view.graphics, ClickEvent);
            });
          } else {
            let query2 = CondosLayer.createQuery();
            query2.where = `OBJECTID = ${objectID}`;
            query2.returnGeometry = true;
            query2.outFields = ["*"];

            CondosLayer.queryFeatures(query2).then(function (response) {
              totalResults = response.features;
              // gets added to firstList in processFeatures
              // so when you splice it, it will be right back every click
              // logic needs to be different
              processFeatures(totalResults, "", capturedEvent);
              addPolygons(response, view.graphics, ClickEvent);
            });
          }
        });
      });

      $(document).ready(function () {
        // Add click event listener to the dynamically generated buttons with class 'justZoom'
        $(document).on("click", ".justZoom", function (event) {
          event.stopPropagation();
          event.preventDefault();

          let targetElement = event.target.closest("li");
          let itemId = targetElement.getAttribute("data-id");
          let objectID = targetElement.getAttribute("object-id");

          if (sessionStorage.getItem("condos") === "no") {
            // If the key doesn't exist, set it to "none"
            let whereClause = `OBJECTID = ${objectID}`;
            let query = noCondosLayer.createQuery();
            query.where = whereClause;
            query.returnGeometry = true;
            query.returnHiddenFields = true; // Adjust based on your needs
            query.outFields = ["*"];

            noCondosLayer.queryFeatures(query).then((response) => {
              let feature = response;
              let geometry = feature.features[0].geometry;

              // Get the extent of the geometry
              const geometryExtent = geometry.extent;

              // Calculate the center of the geometry
              const center = geometryExtent.center;

              // Calculate a new extent with a slightly zoomed-out level
              const zoomOutFactor = 3.0; // Adjust as needed
              const newExtent = geometryExtent.expand(zoomOutFactor);

              // Set the view to the new extent
              view.goTo({
                target: center, // Center the view on the center of the geometry
                extent: newExtent, // Set the extent to the new adjusted extent
              });
            });
          } else {
            let whereClause = `OBJECTID = ${objectID}`;
            // let whereClause = `GIS_LINK = '${matchingObject[0].GIS_LINK}'`;
            let query = CondosLayer.createQuery();
            query.where = whereClause;
            query.returnGeometry = true;
            query.returnHiddenFields = true; // Adjust based on your needs
            query.outFields = ["*"];

            CondosLayer.queryFeatures(query).then((response) => {
              let feature = response;
              let geometry = feature.features[0].geometry;

              // Get the extent of the geometry
              const geometryExtent = geometry.extent;

              // Calculate the center of the geometry
              const center = geometryExtent.center;

              // Calculate a new extent with a slightly zoomed-out level
              const zoomOutFactor = 3.0; // Adjust as needed
              const newExtent = geometryExtent.expand(zoomOutFactor);

              // Set the view to the new extent
              view.goTo({
                target: center, // Center the view on the center of the geometry
                extent: newExtent, // Set the extent to the new adjusted extent
              });
            });
          }
        });
      });

      function sortUniqueArray(criteria) {
        uniqueArray.sort((a, b) => {
          if (criteria === "owner") {
            return a.owner.toLowerCase().localeCompare(b.owner.toLowerCase());
          } else if (criteria === "location") {
            return a.location
              .toLowerCase()
              .localeCompare(b.location.toLowerCase());
          } else if (criteria === "Street_Name") {
            return a.Street_name.toLowerCase().localeCompare(
              b.Street_name.toLowerCase()
            );
          }
        });

        // After sorting, update the display
        updateDisplay();
      }

      function updateDisplay() {
        const featureWidDiv = document.getElementById("featureWid");
        featureWidDiv.innerHTML = ""; // Clear the existing content
        const listGroup = document.createElement("ul");
        listGroup.classList.add("row", "list-group");

        uniqueArray.forEach(function (feature) {
          let objectID = feature.objectid;
          let locationVal = feature.location;
          let locationUniqueId =
            feature.uniqueId === undefined
              ? feature.GIS_LINK
              : feature.uniqueId;
          let locationGISLINK = feature.GIS_LINK;
          let locationCoOwner = feature.coOwner;
          let locationOwner = feature.owner;
          let locationMBL = feature.MBL;
          let locationGeom = feature.geometry;
          let propertyType = feature.Parcel_Type;
          let streetName = feature.Street_Name;
          const imageUrl = `${configVars.imageUrl}${locationUniqueId}.jpg`;

          const listItem = document.createElement("li");
          const imageDiv = document.createElement("li");
          imageDiv.innerHTML = `<img class="img-search image" object-id="${objectID}" src="${imageUrl}" alt="Image of ${locationUniqueId}" >`;
          listItem.classList.add("list-group-item", "col-9");
          listItem.classList.add("search-list");
          imageDiv.setAttribute("object-id", objectID);
          imageDiv.setAttribute("data-id", locationGISLINK);
          imageDiv.classList.add("image-div", "col-3");

          let listItemHTML;
          let displayNoGeometry = sessionStorage.getItem("condos") === "yes";

          if (!locationCoOwner && locationGeom) {
            listItemHTML = ` <div class="listText">UID: ${locationUniqueId} &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;MBL: ${locationMBL} <br> ${locationOwner} ${locationCoOwner} <br> ${locationVal} <br> Property Type: ${propertyType}</div><div class="justZoomBtn"><button type="button" class="btn btn-primary btn-sm justZoom" title="Zoom to Parcel"><calcite-icon icon="magnifying-glass-plus" scale="s"/>Zoom</button><button type="button" class="btn btn-primary btn-sm justRemove" title="Remove from Search List"><calcite-icon icon="minus-circle" scale="s"/>Remove</button></div>`;
          } else if (!locationGeom) {
            listItemHTML = ` <div class="listText">UID: ${locationUniqueId} &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;MBL: ${locationMBL} <br> ${locationOwner} ${locationCoOwner} <br> ${locationVal} <br> Property Type: ${propertyType}</div><div class="justZoomBtn"><button type="button" class="btn btn-primary btn-sm justRemove" title="Remove from Search List"><calcite-icon icon="minus-circle" scale="s"/>Remove</button></div>`;
          } else {
            listItemHTML = ` <div class="listText">UID: ${locationUniqueId} &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;MBL: ${locationMBL} <br> ${locationOwner} ${locationCoOwner} <br> ${locationVal} <br> Property Type: ${propertyType}</div><div class="justZoomBtn"><button type="button" class="btn btn-primary btn-sm justZoom" title="Zoom to Parcel"><calcite-icon icon="magnifying-glass-plus" scale="s"/>Zoom</button><button type="button" class="btn btn-primary btn-sm justRemove" title="Remove from Search List"><calcite-icon icon="minus-circle" scale="s"/>Remove</button></div>`;
          }

          listItem.innerHTML += listItemHTML;
          listItem.setAttribute("object-id", objectID);
          listItem.setAttribute("data-id", locationGISLINK);

          listGroup.appendChild(imageDiv);
          listGroup.appendChild(listItem);
        });

        listGroup.addEventListener("click", function (event) {
          if (
            event.target.closest(".justZoom") ||
            event.target.closest(".justZoomBtn")
          ) {
            return; // Exit the handler early if a button was clicked
          }
          if (clickHandle) {
            clickHandle?.remove();
            clickHandle = null;
          }

          if (DetailsHandle) {
            DetailsHandle?.remove();
            DetailsHandle = null;
          }
          $("#select-button").attr("title", "Select Enabled");
          // Check if the clicked element is an li or a descendant of an li
          let targetElement = event.target.closest("li");

          // If it's not an li, exit the handler
          if (!targetElement) return;

          // Now you can handle the click event as you would in the individual event listener
          let itemId = targetElement.getAttribute("data-id");
          let objectID = targetElement.getAttribute("object-id");
          zoomToFeature(objectID, polygonGraphics, itemId);
          // DetailsHandle = view.on("click", handleDetailsClick);
          // clickHandle.remove();
          $("#details-spinner").show();
          $("#WelcomeBox").hide();
          $("#featureWid").hide();
          $("#result-btns").hide();
          $("#total-results").hide();
          $("#ResultDiv").hide();
          $("#abutters-content").hide();
          $("#details-btns").show();
          $("#abut-mail").show();
          $("#detailBox").show();
          $("#backButton").show();
          $("#detailsButton").hide();
          $("#detail-content").empty();
          $("#selected-feature").empty();
          $("#exportButtons").hide();
          $("#exportSearch").hide();
          $("#exportResults").hide();
          $("#csvExportResults").hide();
          $("#csvExportSearch").hide();
          $("#results-div").css("height", "300px");
          $("#backButton-div").css("padding-top", "0px");
          $(".center-container").hide();

          buildDetailsPanel(objectID, itemId);
        });

        featureWidDiv.appendChild(listGroup);
      }

      document
        .getElementById("sortByOwner")
        .addEventListener("click", function () {
          sortUniqueArray("owner");
        });

      document
        .getElementById("sortByLocation")
        .addEventListener("click", function () {
          sortUniqueArray("location");
        });

      function buildResultsPanel(
        features,
        polygonGraphics,
        e,
        pointGraphic,
        pointLocation,
        pointGisLink
      ) {
        $("status-loader").show();
        $("#featureWid").empty();

        let seenIds = new Set();
        let seenUID = new Set();
        // Step 1: Filter for unique objectid with geometry
        uniqueArray = firstList.filter((obj) => {
          if (obj.geometry) {
            seenIds.add(obj.uniqueId);
            return true;
          }
          return false;
        });

        // Step 2: Filter remaining items for unique uniqueId
        firstList.forEach((obj) => {
          const isNewuid = !seenIds.has(obj.uniqueId);
          if (isNewuid) {
            seenUID.add(obj.uniqueId);
            uniqueArray.push(obj);
          }
        });

        // Updated sorting to handle null or undefined owner properties
        uniqueArray.sort((a, b) => {
          const ownerA = a.owner ? a.owner.toLowerCase() : "";
          const ownerB = b.owner ? b.owner.toLowerCase() : "";
          return ownerA.localeCompare(ownerB);
        });

        function removeDups(pointGraphic, pointLocation, pointGisLink) {
          uniqueArray = uniqueArray.filter(
            (item) => item.objectid != pointGraphic
          );
          uniqueArray = uniqueArray.filter(
            (item) => item.location != pointLocation
          );
          firstList = firstList.filter((item) => item.objectid != pointGraphic);
          firstList = firstList.filter(
            (item) => item.location != pointLocation
          );

          $(`li[object-id="${pointGraphic}"]`).remove();

          if (sessionStorage.getItem("condos") == "no") {
            firstList = firstList.filter(
              (item) => item.GIS_LINK != pointGisLink
            );
            uniqueArray = uniqueArray.filter(
              (item) => item.GIS_LINK != pointGisLink
            );
            $(`li[data-id="${pointGisLink}"]`).remove();
          }
        }

        removeDups(pointGraphic, pointLocation, pointGisLink);

        const featureWidDiv = document.getElementById("featureWid");
        const listGroup = document.createElement("ul");

        // if (uniqueArray.length <= 0) {
        //   clearContents();
        //   alert("Parcel Selection did not return any results.");
        // }

        uniqueArray.forEach(function (feature) {
          // console.log(feature);

          let objectID = feature.objectid;
          let locationVal = feature.location;
          let locationUniqueId =
            feature.uniqueId === undefined
              ? feature.GIS_LINK
              : feature.uniqueId;
          let locationGISLINK = feature.GIS_LINK;
          let locationCoOwner = feature.coOwner;
          let locationOwner = feature.owner;
          let locationMBL = feature.MBL;
          let locationGeom = feature.geometry;
          let propertyType = feature.Parcel_Type;

          const imageUrl = `${configVars.imageUrl}${locationUniqueId}.jpg`;

          listGroup.classList.add("row");
          listGroup.classList.add("list-group");

          const listItem = document.createElement("li");
          const imageDiv = document.createElement("li");
          imageDiv.innerHTML = `<img class="img-search image" object-id="${objectID}" src="${imageUrl}" alt="Image of ${locationUniqueId}" >`;
          listItem.classList.add("list-group-item", "col-9");
          listItem.classList.add("search-list");
          imageDiv.setAttribute("object-id", objectID);
          imageDiv.setAttribute("data-id", locationGISLINK);

          imageDiv.classList.add("image-div", "col-3");

          let listItemHTML;
          let displayNoGeometry;

          if (sessionStorage.getItem(key2) === "yes") {
            displayNoGeometry = true;
          } else {
            displayNoGeometry = false;
          }

          if (!locationCoOwner && locationGeom) {
            listItemHTML = ` <div class="listText">UID: ${locationUniqueId}  &nbsp;<br>MBL: ${locationMBL} <br> ${locationOwner} ${locationCoOwner} <br> ${locationVal} <br> Property Type: ${propertyType} <br><a target="_blank" class='pdf-links' rel="noopener noreferrer" href=https://publicweb-gis.s3.amazonaws.com/PDFs/${configVars.parcelMapUrl}/Quick_Maps/QM_${locationUniqueId}.pdf>PDF Map</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a target="_blank" class='pdf-links' rel="noopener noreferrer" href=${configVars.propertyCard}&amp;uniqueid=${locationUniqueId}>Property Card</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </div><div class="justZoomBtn"><button type="button" class="btn btn-primary btn-sm justZoom" title="Zoom to Parcel"><calcite-icon icon="magnifying-glass-plus" scale="s"/>Zoom</button><button type="button" class="btn btn-primary btn-sm justRemove" title="Remove from Search List"><calcite-icon icon="minus-circle" scale="s"/>Remove</button></div>`;
          } else if (!locationGeom) {
            listItemHTML = ` <div class="listText">UID: ${locationUniqueId}  &nbsp;<br>MBL: ${locationMBL} <br> ${locationOwner} ${locationCoOwner} <br> ${locationVal} <br> Property Type: ${propertyType} <br><a target="_blank" class='pdf-links' rel="noopener noreferrer" href=https://publicweb-gis.s3.amazonaws.com/PDFs/${configVars.parcelMapUrl}/Quick_Maps/QM_${locationUniqueId}.pdf>PDF Map</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <a target="_blank" class='pdf-links' rel="noopener noreferrer" href=${configVars.propertyCard}&amp;uniqueid=${locationUniqueId}>Property Card</a></div><div class="justZoomBtn"><button type="button" class="btn btn-primary btn-sm justRemove" title="Remove from Search List"><calcite-icon icon="minus-circle" scale="s"/>Remove</button></div>`;
          } else {
            listItemHTML = ` <div class="listText">UID: ${locationUniqueId}  &nbsp;<br>MBL: ${locationMBL} <br> ${locationOwner} ${locationCoOwner} <br> ${locationVal} <br> Property Type: ${propertyType} <br><a target="_blank" class='pdf-links' rel="noopener noreferrer" href=https://publicweb-gis.s3.amazonaws.com/PDFs/${configVars.parcelMapUrl}/Quick_Maps/QM_${locationUniqueId}.pdf>PDF Map</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <a target="_blank" class='pdf-links' rel="noopener noreferrer" href=${configVars.propertyCard}&amp;uniqueid=${locationUniqueId}>Property Card</a></div><div class="justZoomBtn"><button type="button" class="btn btn-primary btn-sm justZoom" title="Zoom to Parcel"><calcite-icon icon="magnifying-glass-plus" scale="s"/>Zoom</button><button type="button" class="btn btn-primary btn-sm justRemove" title="Remove from Search List"><calcite-icon icon="minus-circle" scale="s"/>Remove</button></div>`;
          }

          // Append the new list item to the list
          listItem.innerHTML += listItemHTML;
          listItem.setAttribute("object-id", objectID);
          listItem.setAttribute("data-id", locationGISLINK);

          listGroup.appendChild(imageDiv);
          listGroup.appendChild(listItem);
        });

        searchResults = uniqueArray.length;

        // $(document).ready(function () {
        $("#total-results").show();
        $("#ResultDiv").show();
        $("#total-results").html(searchResults + " results returned");
        $("#backButton").hide();
        $("#detailsButton").hide();
        $("#filterDiv").hide();
        $("#layerListDiv").hide();
        $("#result-btns").hide();
        $("#details-btns").hide();
        $("#abut-mail").hide();
        $("#featureWid").show();
        $("#detail-content").empty();
        $("#dropdown").toggleClass("expanded");
        $("status-loader").hide();
        $("#dropdown").show();
        $("#sidebar2").css("left", "0px");

        $("#sidebar2").addClass("collapsed");
        $("#results-div").css("left", "350px");
        $("#left-arrow-2").show();
        $("#right-arrow-2").hide();
        $("#WelcomeBox").hide();
        // $("#results-div").css("height", "200px");

        // if (uniqueArray.length <= 1) {
        //   $("#exportSearch").hide();
        $("#csvExportResults").hide();
        // } else {
        $("#exportSearch").show();
        // }
        $("#results-div").css("height", "300px");
        $("#exportButtons").show();
        $("#exportResults").hide();
        $("#csvExportSearch").show();
        $(".spinner-container").hide();
        $(`li[object-id="${pointGraphic}"]`).remove();

        listGroup.addEventListener("click", function (event) {
          if (
            event.target.closest(".justZoom") ||
            event.target.closest(".justZoomBtn") ||
            event.target.closest(".pdf-links")
          ) {
            return; // Exit the handler early if a button was clicked
          }
          if (clickHandle) {
            clickHandle?.remove();
            clickHandle = null;
          }

          if (DetailsHandle) {
            DetailsHandle?.remove();
            DetailsHandle = null;
          }
          $("#select-button").attr("title", "Select Enabled");
          // Check if the clicked element is an li or a descendant of an li
          let targetElement = event.target.closest("li");

          // If it's not an li, exit the handler
          if (!targetElement) return;

          // Now you can handle the click event as you would in the individual event listener
          let itemId = targetElement.getAttribute("data-id");
          let objectID = targetElement.getAttribute("object-id");
          zoomToFeature(objectID, polygonGraphics, itemId);
          // DetailsHandle = view.on("click", handleDetailsClick);
          // clickHandle.remove();
          $("#details-spinner").show();
          $("#WelcomeBox").hide();
          $("#featureWid").hide();
          $("#result-btns").hide();
          $("#total-results").hide();
          $("#ResultDiv").hide();
          $("#abutters-content").hide();
          $("#details-btns").show();
          $("#abut-mail").show();
          $("#detailBox").show();
          $("#backButton").show();
          $("#detailsButton").hide();
          $("#detail-content").empty();
          $("#selected-feature").empty();
          $("#exportButtons").hide();
          $("#exportSearch").hide();
          $("#exportResults").hide();
          $("#csvExportResults").hide();
          $("#csvExportSearch").hide();
          $("#results-div").css("height", "300px");
          $("#backButton-div").css("padding-top", "0px");
          $(".center-container").hide();
          $("#abutters-attributes").prop("disabled", false);
          $("#abutters-zoom").prop("disabled", false);

          buildDetailsPanel(objectID, itemId);
        });

        featureWidDiv.appendChild(listGroup);
      }

      function processFeatures(features, polygonGraphics, e, removeFromList) {
        let pointGraphic;
        let pointLocation;
        let pointGisLink;
        function createList(features) {
          features.forEach(function (feature) {
            // PUT BACK TO FILTER OUT EMPTY OWNERS
            if (feature.attributes.Owner === "" || null || undefined) {
              return;
            } else {
              let objectId = feature.attributes["OBJECTID"];
              let locationVal = feature.attributes.Location;
              let locationUniqueId = feature.attributes["Uniqueid"];
              let locationGISLINK = feature.attributes["GIS_LINK"];
              let locationCoOwner = feature.attributes["Co_Owner"];
              let locationOwner = feature.attributes["Owner"];
              let locationMBL = feature.attributes["MBL"];
              let locationGeom = feature.geometry;
              let mailingAddress = feature.attributes["Mailing_Address_1"];
              let mailingAddress2 = feature.attributes["Mailing_Address_2"];
              let Mailing_City = feature.attributes["Mailing_City"];
              let Mail_State = feature.attributes["Mail_State"];
              let Mailing_Zip = feature.attributes["Mailing_Zip"];
              let Total_Acres = feature.attributes["Total_Acres"];
              let Parcel_Primary_Use = feature.attributes["Parcel_Primary_Use"];
              let Building_Use_Code = feature.attributes["Building_Use_Code"];
              let Parcel_Type = feature.attributes["Parcel_Type"];
              let Design_Type = feature.attributes["Design_Type"];
              let Zoning = feature.attributes["Zoning"];
              let Neighborhood = feature.attributes["Neighborhood"];
              let Land_Type_Rate = feature.attributes["Land_Type_Rate"];
              let Functional_Obs = feature.attributes["Functional_Obs"];
              let External_Obs = feature.attributes["External_Obs"];
              let orig_date = feature.attributes["Sale_Date"];
              let Sale_Date = formatDate(orig_date);
              let Sale_Price = feature.attributes["Sale_Price"];
              let Vol_Page = feature.attributes["Vol_Page"];
              let Assessed_Total = feature.attributes["Assessed_Total"];
              let Appraised_Total = feature.attributes["Appraised_Total"];
              let Influence_Factor = feature.attributes["Influence_Factor"];
              let Influence_Type = feature.attributes["Influence_Type"];
              let Land_Type = feature.attributes["Land_Type"];
              let Prior_Assessment_Year =
                feature.attributes["Prior_Assessment_Year"];
              let Prior_Assessed_Total =
                feature.attributes["Prior_Assessed_Total"];
              let Prior_Appraised_Total =
                feature.attributes["Prior_Appraised_Total"];
              let Map = feature.attributes["Map"];
              let Lat = feature.attributes["Lat"];
              let Lon = feature.attributes["Lon"];

              firstList.push(
                new Parcel(
                  objectId,
                  locationVal,
                  locationUniqueId,
                  locationGISLINK,
                  locationCoOwner,
                  locationOwner,
                  locationMBL,
                  locationGeom,
                  mailingAddress,
                  mailingAddress2,
                  Mailing_City,
                  Mail_State,
                  Mailing_Zip,
                  Total_Acres,
                  Parcel_Primary_Use,
                  Building_Use_Code,
                  Parcel_Type,
                  Design_Type,
                  Zoning,
                  Neighborhood,
                  Land_Type_Rate,
                  Functional_Obs,
                  External_Obs,
                  Sale_Date,
                  Sale_Price,
                  Vol_Page,
                  Assessed_Total,
                  Appraised_Total,
                  Influence_Factor,
                  Influence_Type,
                  Land_Type,
                  Prior_Assessment_Year,
                  Prior_Assessed_Total,
                  Prior_Appraised_Total,
                  Map,
                  Lat,
                  Lon
                )
              );
            }
          });
        }

        if (e) {
          pointGraphic = features[0].attributes.OBJECTID;
          pointLocation = features[0].attributes.Location;
          pointGisLink = features[0].attributes.GIS_LINK;

          const count = firstList.filter(
            (g) => g.objectid === pointGraphic
          ).length;

          if (count >= 1) {
            buildResultsPanel(
              features,
              polygonGraphics,
              e,
              pointGraphic,
              pointLocation,
              pointGisLink
            );
          } else {
            createList(features);
            buildResultsPanel(features);
          }
        } else {
          if (!features) {
            buildResultsPanel("", polygonGraphics, e, pointGraphic);
          } else if (features.length > 1) {
            if (!lasso) {
              features = features.filter(
                (item) => item.attributes.ACCOUNT_TYPE != "CONDOMAIN"
              );
            }
            createList(features);
          } else {
            createList(features);
          }
        }

        if (e) {
          return;
        } else {
          buildResultsPanel(
            features,
            polygonGraphics,
            e,
            pointGraphic,
            pointLocation,
            pointGisLink
          );
        }
      }

      let features;

      function addPolygons(
        polygonGeometries,
        graphicsLayer,
        ClickEvent,
        tableSearch
      ) {
        let count;
        let countCondos;

        // formats of queries from table and feature layer different
        if (tableSearch) {
          features = polygonGeometries;
        } else {
          features = polygonGeometries.features;
        }

        let polygonGraphics2 = [];
        let bufferGraphicId;
        let pointGisLink;

        var fillSymbol = {
          type: "simple-fill",
          color: [127, 42, 145, 0.4],
          outline: {
            color: [127, 42, 145, 0.8],
            width: 2,
          },
        };

        if (ClickEvent) {
          let array = [];
          bufferGraphicId = polygonGeometries.features[0].attributes.OBJECTID;
          pointGisLink = features[0].attributes.GIS_LINK;

          const graphic = new Graphic({
            geometry: features[0].geometry,
            symbol: fillSymbol,
            id: bufferGraphicId,
          });

          polygonGraphics2.push(graphic);

          countCondos = firstList.filter(
            (g) => g.GIS_LINK === pointGisLink
          ).length;

          count = view.graphics.some((g) => g.id === bufferGraphicId);

          if (count) {
            const firstIndex = view.graphics.findIndex(
              (g) => g.id === bufferGraphicId
            );

            view.graphics.removeAt(firstIndex);

            const graphicIndex = polygonGraphics.findIndex(
              (g) => g.id === bufferGraphicId
            );

            // const graphicIndex2 = polygonGraphics2.findIndex(
            //   (g) => g.id === bufferGraphicId
            // );
            if (polygonGraphics.length === 1) {
              polygonGraphics.splice(0, 1);
            } else {
              polygonGraphics.splice(graphicIndex, 1);
            }

            // polygonGraphics2.splice(graphicIndex, 1);

            if (polygonGraphics.length === 0) {
              if (!DetailsHandle) {
                DetailsHandle = view.on("click", handleDetailsClick);
              }
              if (clickHandle) {
                clickHandle?.remove();
                clickHandle = null;
              }
              clickHandle = view.on("click", handleClick);
            }

            // will zoom to extent of adding and deselecting
            view.goTo(polygonGraphics);
          } else {
            graphicsLayer.addMany(polygonGraphics2);
          }
        } else {
          if (tableSearch) {
            // First, filter out features without geometry
            const featuresWithGeometry = features.filter(
              (feature) => feature.geometry
            );

            // Now, map each feature with geometry to a new graphic and add it to the polygonGraphics2 array
            featuresWithGeometry.forEach((feature) => {
              const bufferGraphicId = feature.attributes.OBJECTID;

              const graphic = new Graphic({
                geometry: feature.geometry,
                symbol: fillSymbol,
                id: bufferGraphicId,
              });

              polygonGraphics2.push(graphic);
            });

            if (polygonGraphics2.length >= 1) {
              graphicsLayer.addMany(polygonGraphics2);
            }
            view.goTo(polygonGraphics);
          } else {
            regSearch = true;
            // regular search polygons added here
            features
              .map(function (feature) {
                bufferGraphicId = feature.attributes.OBJECTID;
                if (!feature.geometry || tableSearch) {
                  console.error("Feature does not have geometry:", feature);
                  return null; // Skip this feature as it has no geometry
                }
                const graphic = new Graphic({
                  geometry: feature.geometry,
                  symbol: fillSymbol,
                  id: bufferGraphicId,
                });
                polygonGraphics2.push(graphic);
              })
              .filter((graphic) => graphic !== null);

            if (polygonGraphics2.length >= 1) {
              graphicsLayer.addMany(polygonGraphics2);
            }

            view.goTo(polygonGraphics2);
          }
        }

        if (!polygonGraphics) {
          polygonGraphics = polygonGraphics2;
        }

        if (ClickEvent && !count) {
          let id = polygonGraphics2[0].id;
          polygonGraphics = [...polygonGraphics, polygonGraphics2[0]];
          removeFromList = id;
        }
        if (regSearch) {
          polygonGraphics = polygonGraphics2;
        }
        count = false;
        regSearch = false;
        // count = 0;
      }

      let sketch = new SketchViewModel({
        view: view,
        layer: sketchGL,
        defaultCreateOptions: {
          mode: "freehand",
        },

        polygonSymbol: {
          type: "simple-fill",
          style: "cross",
          color: "rgb(145, 199, 61)",
          outline: {
            width: 3,
            style: "solid",
            color: "rgba(127, 42, 145, 1)",
          },
        },

        defaultUpdateOptions: { tool: "reshape", toggleToolOnClick: false },
      });

      function highlightLasso(lasso) {
        // $("#select-button").prop("disabled", true);
        // $("#select-button").addClass("disabled");

        let results = [];
        let features = [];
        let totalResults = [];
        let graphicsLayer = view.graphics;

        function runCondoQuery() {
          let query2 = CondosLayer.createQuery();
          query2.geometry = lasso;
          query2.distance = 1;
          query2.units = "feet";
          query2.spatialRelationship = "intersects";
          query2.returnGeometry = true;
          query2.outFields = ["*"];

          CondosLayer.queryFeatures(query2).then(function (response) {
            totalResults = response.features;
            addResultGraphics(totalResults);
          });
        }

        function runNoCondosQuery() {
          let query = noCondosLayer.createQuery();
          query.geometry = lasso;
          query.distance = 1;
          query.units = "feet";
          query.spatialRelationship = "intersects";
          query.returnGeometry = true;
          query.outFields = ["*"];

          noCondosLayer.queryFeatures(query).then(function (response) {
            totalResults = response.features;
            addResultGraphics(totalResults);
          });
        }

        if (sessionStorage.getItem("condos") == "no") {
          runNoCondosQuery();
        } else {
          runCondoQuery();
        }

        function addResultGraphics(finalResults) {
          var fillSymbol = {
            type: "simple-fill",
            color: [127, 42, 145, 0.4],
            outline: {
              color: [127, 42, 145, 0.8],
              width: 2,
            },
          };

          // Map each geometry to a graphic
          polygonGraphics = finalResults
            .map(function (feature) {
              if (!feature.geometry) {
                console.error("Feature does not have geometry:", feature);
                return null; // Skip this feature as it has no geometry
              }
              return new Graphic({
                geometry: feature.geometry,
                symbol: fillSymbol,
                id: feature.attributes.OBJECTID,
              });
            })
            .filter((graphic) => graphic !== null);

          // Add all polygon graphics to the graphics layer
          graphicsLayer.addMany(polygonGraphics);
          sketchGL.removeAll();
          processFeatures(finalResults, polygonGraphics);
          lasso = false;
        }
      }

      $("#lasso").on("click", function (e) {
        lasso = !lasso;
        select = false;
        $("#select-button").removeClass("btn-warning");
        $("#select-button").prop("disabled", false);

        if (lasso && !select) {
          sketch.create("polygon");

          $("#select-button").removeClass("btn-warning");
          $("#lasso").addClass("btn-warning");
        } else {
          sketch.cancel();
          $("#lasso").removeClass("btn-warning");
          $("#lasso").addClass("btn-info");
          $("#select-button").removeClass("btn-warning");
          $("#select-button").addClass("btn-info");
        }

        clearContents(e, "no");
        sketchGL.removeAll();

        if (sessionStorage.getItem("condos") === "no") {
          noCondosLayer.visible = true;
        } else {
          CondosLayer.visible = true;
        }
      });

      // listen to create event, only respond when event's state changes to complete
      sketch.on("create", function (event) {
        if (event.state === "complete") {
          sketchGL.remove(event.graphic);
          sketchGL.add(event.graphic);
          highlightLasso(event.graphic.geometry);
          // lasso = true;
          if (DetailsHandle) {
            DetailsHandle?.remove();
            DetailsHandle = null;
          }
          if (clickHandle) {
            clickHandle?.remove();
            clickHandle = null;
          }

          clickHandle = view.on("click", handleClick);
          $("#lasso").removeClass("btn-warning");
          $("#lasso").addClass("btn-info");
          $("#select-button").addClass("btn-warning");
        }
      });

      $("#select-button").on("click", function (e) {
        sketch.cancel();
        if (overRide) {
          select = true;
        } else {
          select = !select;
        }

        if (!select) {
          clearContents();
        }
        lasso = false;

        if (select && !lasso) {
          $("#lasso").removeClass("btn-warning");
          $("#select-button").addClass("btn-warning");
        } else {
          $("#select-button").removeClass("btn-warning");
        }

        if (sessionStorage.getItem("condos") === "no") {
          noCondosLayer.visible = true;
        } else {
          CondosLayer.visible = true;
        }

        // works for search and in details page
        if (select && !lasso) {
          if (clickHandle) {
            try {
              clickHandle?.remove();
              clickHandle = null;
            } catch (error) {
              console.error("Failed to remove clickHandle", error);
            }
          }
          if (DetailsHandle) {
            try {
              DetailsHandle?.remove();
              DetailsHandle = null;
            } catch (error) {
              console.error("Failed to remove DetailsHandle", error);
            }
          }
          // DetailsHandle = view.on("click", handleDetailsClick);
          clickHandle = view.on("click", handleClick);
        } else if (select && lasso) {
          if (DetailsHandle) {
            DetailsHandle?.remove();
            DetailsHandle = null;
          }
          if (clickHandle) {
            clickHandle?.remove();
            clickHandle = null;
          }
          clickHandle = view.on("click", handleClick);
        } else {
          if (clickHandle) {
            try {
              clickHandle?.remove();
              clickHandle = null;
            } catch (error) {
              console.error("Failed to remove clickHandle", error);
            }
          }
          if (DetailsHandle) {
            try {
              DetailsHandle?.remove();
              DetailsHandle = null;
            } catch (error) {
              console.error("Failed to remove DetailsHandle", error);
            }
          }
        }
      });

      $("#home").on("click", function (e) {
        view.goTo(configVars.homeExtent);
      });

      class Parcel {
        constructor(
          objectid,
          location,
          uniqueId,
          gisLink,
          coOwner,
          owner,
          MBL,
          geometry,
          mailingAddress,
          mailingAddress2,
          Mailing_City,
          Mail_State,
          Mailing_Zip,
          Total_Acres,
          Parcel_Primary_Use,
          Building_Use_Code,
          Parcel_Type,
          Design_Type,
          Zoning,
          Neighborhood,
          Land_Type_Rate,
          Functional_Obs,
          External_Obs,
          Sale_Date,
          Sale_Price,
          Vol_Page,
          Assessed_Total,
          Appraised_Total,
          Influence_Factor,
          Influence_Type,
          Land_Type,
          Prior_Assessment_Year,
          Prior_Assessed_Total,
          Prior_Appraised_Total,
          Map,
          Lat,
          Lon
        ) {
          this.objectid = objectid;
          this.location = location;
          this.uniqueId = uniqueId;
          this.GIS_LINK = gisLink;
          this.coOwner = coOwner;
          this.owner = owner;
          this.MBL = MBL;
          this.geometry = geometry;
          this.mailingAddress = mailingAddress;
          this.mailingAddress2 = mailingAddress2;
          this.Mailing_City = Mailing_City;
          this.Mail_State = Mail_State;
          this.Mailing_Zip = Mailing_Zip;
          this.Total_Acres = Total_Acres;
          this.Parcel_Primary_Use = Parcel_Primary_Use;
          this.Building_Use_Code = Building_Use_Code;
          this.Parcel_Type = Parcel_Type;
          this.Design_Type = Design_Type;
          this.Zoning = Zoning;
          this.Neighborhood = Neighborhood;
          this.Land_Type_Rate = Land_Type_Rate;
          this.Functional_Obs = Functional_Obs;
          this.External_Obs = External_Obs;
          this.Sale_Date = Sale_Date;
          this.Sale_Price = Sale_Price;
          this.Vol_Page = Vol_Page;
          this.Assessed_Total = Assessed_Total;
          this.Appraised_Total = Appraised_Total;
          this.Influence_Factor = Influence_Factor;
          this.Influence_Type = Influence_Type;
          this.Land_Type = Land_Type;
          this.Prior_Assessment_Year = Prior_Assessment_Year;
          this.Prior_Assessed_Total = Prior_Assessed_Total;
          this.Prior_Appraised_Total = Prior_Appraised_Total;
          this.Map = Map;
          this.LAT = Lat;
          this.LON = Lon;
        }
      }

      // Wait until the view is loaded
      view.when(function () {
        document.getElementById("zoom-in").onclick = function () {
          view.zoom += 1;
        };

        // Set up the event listener for the zoom out button
        document.getElementById("zoom-out").onclick = function () {
          view.zoom -= 1;
        };
      });

      clearBtn1.addEventListener("click", function () {
        clearContents();
      });

      clearBtn2.addEventListener("click", function () {
        clearContents();
      });

      document
        .getElementById("searchInput")
        .addEventListener("input", function (e) {
          runQuerySearchTerm = e.target.value.toUpperCase();
        });

      function queryRelatedRecords(searchTerm, urlSearch) {
        if (sessionStorage.getItem("condos") === "no") {
          noCondosLayer.visible = true;
        } else {
          CondosLayer.visible = true;
        }

        $(".spinner-container").show();
        const tableSearch = true;
        let whereClause = `
          Street_Name LIKE '%${searchTerm}%' OR 
          MBL LIKE '%${searchTerm}%' OR 
          Location LIKE '%${searchTerm}%' OR 
          Co_Owner LIKE '%${searchTerm}%' OR 
          Uniqueid LIKE '%${searchTerm}%' OR 
          Owner LIKE '%${searchTerm}%' OR 
          GIS_LINK LIKE '%${searchTerm}%'
      `;

        let GISLINK;

        let query = noCondosLayer.createQuery();
        query.where = whereClause;
        query.returnGeometry = true; // Adjust based on your needs
        query.outFields = ["*"];

        let query2 = CondosLayer.createQuery();
        query2.where = whereClause;
        query2.returnGeometry = true; // Adjust based on your needs
        query2.outFields = ["*"];

        let triggerUrl;

        if (sessionStorage.getItem("condos") === "no") {
          noCondosLayer.queryFeatures(query).then(function (result) {
            triggerUrl = result.features;
            if (result.features.length >= 1) {
              triggerUrl = result.features;
              noCondosParcelGeom = result.features;
              addPolygons(result, view.graphics);
              processFeatures(result.features);
              if (urlSearch) {
                triggerListGroup(triggerUrl, searchTerm);
              }

              if (result.features.length == 1) {
                view.goTo({
                  target: result.features,
                  // zoom: 15,
                });
              } else {
                view.goTo({
                  target: result.features,
                });
              }
            } else if (result.features.length === 1 && firstList.length > 2) {
              const firstQuery = noCondosTable.createQuery();
              firstQuery.where = whereClause;
              firstQuery.returnGeometry = false;
              firstQuery.outFields = ["*"];

              noCondosTable.queryFeatures(firstQuery).then(function (result) {
                addPolygons(result.features, "", "", tableSearch);
                processFeatures();
                if (urlSearch) {
                  triggerListGroup(triggerUrl, searchTerm);
                }
              });
            } else {
              const firstQuery = noCondosTable.createQuery();
              firstQuery.where = whereClause;
              firstQuery.returnGeometry = false;
              firstQuery.outFields = ["*"];

              if (result.features.length == 0) {
                noCondosTable
                  .queryFeatures(firstQuery)
                  .then(function (result) {
                    if (result.features.length <= 0) {
                      clearContents();
                      alert("Search resulted in an error, please try again.");
                    }
                    GISLINK = result.features[0].attributes.GIS_LINK;
                  })
                  .then(function (result) {
                    const newQuery = noCondosLayer.createQuery();
                    newQuery.where = `GIS_LINK = '${GISLINK}'`;
                    newQuery.returnGeometry = true;
                    newQuery.outFields = ["*"];

                    noCondosLayer
                      .queryFeatures(newQuery)
                      .then(function (result) {
                        // console.log(result);

                        view.goTo({
                          target: result.features,
                          // zoom: 15,
                        });

                        noCondosParcelGeom = result.features;
                        addPolygons(result, view.graphics);
                        processFeatures(result.features);
                        if (urlSearch) {
                          triggerListGroup(triggerUrl, searchTerm);
                        }
                      });
                  });
              }
            }
          });
        } else {
          CondosLayer.queryFeatures(query2).then(function (result) {
            triggerUrl = result.features;
            if (result.features) {
              // console.log(`condos result: ${result}`);
              if (result.features.length > 2) {
                view.goTo(result.features);
              } else {
                view.goTo({
                  target: result.features,
                  zoom: 15,
                });
              }
              addPolygons(result, view.graphics);
              processFeatures(result.features);
              if (urlSearch) {
                triggerListGroup(triggerUrl, searchTerm);
              }
            }
          });
        }
        if (clickHandle) {
          clickHandle?.remove();
          clickHandle = null;
        }
        if (DetailsHandle) {
          DetailsHandle?.remove();
          DetailsHandle = null;
        }
        DetailsHandle = view.on("click", handleDetailsClick);
        lasso = false;
        select = false;
      }

      function handleDetailsClick(event) {
        if (clickHandle) {
          clickHandle?.remove();
          clickHandle = null;
        }
        $("#details-spinner").show();
        $("#featureWid").hide();
        $("#result-btns").hide();
        $("#total-results").hide();
        $("#ResultDiv").hide();
        $("#abutters-content").hide();
        $("#details-btns").show();
        $("#abut-mail").show();
        $("#detailBox").show();
        $("#backButton").show();
        $("#detailsButton").hide();
        $("#detail-content").empty();
        $("#selected-feature").empty();
        $("#exportSearch").hide();
        $("#exportButtons").hide();
        $("#results-div").css("height", "300px");
        $("#backButton-div").css("padding-top", "0px");
        $("#abutters-attributes").prop("disabled", false);
        $("#abutters-zoom").prop("disabled", false);

        if (sessionStorage.getItem("condos") === "no") {
          let query = CondosLayer.createQuery();
          query.geometry = event.mapPoint;
          query.distance = 1;
          query.units = "feet";
          query.spatialRelationship = "within";
          query.returnGeometry = true;
          query.outFields = ["*"];

          noCondosLayer.queryFeatures(query).then(function (response) {
            totalResults = response.features;
            if (totalResults.length > 0) {
              let objID = response.features[0].attributes.OBJECTID;
              let geom = response.features[0].geometry;
              let item = response.features[0];
              zoomToDetail(objID, geom, item);
              clickDetailsPanel(totalResults);
            } else {
              $("#results-div").css("height", "300px");
              $("#backButton-div").css("padding-top", "0px");
              $(".center-container").hide();
              $("#layerListDiv").hide();
              $("#details-spinner").hide();
              $("#featureWid").hide();
              $("#result-btns").hide();
              $("#total-results").hide();
              $("#ResultDiv").hide();
              $("#abutters-content").hide();
              $("#details-btns").show();
              $("#abut-mail").show();
              $("#detailBox").show();
              $("#backButton").show();
              $("#detailsButton").hide();
              $("#detail-content").html(
                `<h5 style="color: red;">Issue selecting Parcel. Please make another selection.</h5>`
              );

              $("#abutters-attributes").prop("disabled", true);
              $("#abutters-zoom").prop("disabled", true);
              $("#selected-feature").empty();
              $("#exportSearch").hide();
              $("#exportButtons").hide();

              return;
            }
          });
        } else {
          let query2 = CondosLayer.createQuery();
          query2.geometry = event.mapPoint;
          query2.distance = 1;
          query2.units = "feet";
          query2.spatialRelationship = "within";
          query2.returnGeometry = true;
          query2.outFields = ["*"];

          CondosLayer.queryFeatures(query2).then(function (response) {
            totalResults = response.features;
            if (totalResults.length > 0) {
              let objID = response.features[0].attributes.OBJECTID;
              let geom = response.features[0].geometry;
              let item = response.features[0];
              zoomToDetail(objID, geom, item);
              clickDetailsPanel(totalResults);
            } else {
              $("#details-spinner").hide();
              $("#featureWid").hide();
              $("#result-btns").hide();
              $("#total-results").hide();
              $("#ResultDiv").hide();
              $("#abutters-content").hide();
              $("#details-btns").show();
              $("#abut-mail").show();
              $("#detailBox").show();
              $("#backButton").show();
              $("#detailsButton").hide();
              $("#detail-content").html(
                `<h5 style="color: red;">Issue selecting Parcel. Please make another selection.</h5>`
              );
              $("#abutters-attributes").prop("disabled", true);
              $("#abutters-zoom").prop("disabled", true);
              $("#selected-feature").empty();
              $("#exportSearch").hide();
              $("#exportButtons").hide();
              $("#results-div").css("height", "300px");
              $("#backButton-div").css("padding-top", "0px");

              // alert("Error: please select parcel within town boundary");
              return;
            }
          });
        }
      }

      function handleClick(event) {
        detailsHandleUsed = "click";
        // console.log(event);

        isClickEvent = true;
        if (DetailsHandle) {
          DetailsHandle?.remove();
          DetailsHandle = null;
        }

        if (sessionStorage.getItem("condos") === "no") {
          let query = CondosLayer.createQuery();
          query.geometry = event.mapPoint;
          query.distance = 1;
          query.units = "feet";
          query.spatialRelationship = "within";
          query.returnGeometry = true;
          query.outFields = ["*"];

          noCondosLayer.queryFeatures(query).then(function (response) {
            if (response.features) {
              totalResults = response.features;
              processFeatures(totalResults, "", event);
              addPolygons(response, view.graphics, isClickEvent);
            } else {
              return;
            }
          });
        } else {
          let query2 = CondosLayer.createQuery();
          query2.geometry = event.mapPoint;
          query2.distance = 1;
          query2.units = "feet";
          query2.spatialRelationship = "within";
          query2.returnGeometry = true;
          query2.outFields = ["*"];

          CondosLayer.queryFeatures(query2).then(function (response) {
            if (response.features) {
              totalResults = response.features;
              processFeatures(totalResults, "", event);
              addPolygons(response, view.graphics, isClickEvent);
            } else {
              return;
            }
          });
        }
      }

      // items on the left panel

      $(document).ready(function () {
        $("#backButton").on("click", function () {
          if (polygonGraphics && polygonGraphics.length >= 1) {
            $("#WelcomeBox").hide();
            $("#select-button").prop("disabled", false);
            $("#detailBox").hide();
            $("#filterDiv").hide();
            $("#layerListDiv").hide();
            $("#featureWid").show();
            $("#total-results").show();
            $("#ResultDiv").show();
            $("#details-btns").hide();
            $("#abut-mail").hide();
            $("#detail-content").empty();
            $("#backButton").hide();
            $("#detailsButton").hide();
            $("#abutters-content").hide();
            $("#selected-feature").empty();
            $("#parcel-feature").empty();
            $("#exportResults").hide();
            $("#csvExportResults").hide();
            $("#csvExportSearch").show();
            $("#exportButtons").show();
            $("#exportSearch").show();
            $("#results-div").css("height", "300px");
            $(".center-container").show();
            view.graphics.removeAll();
            view.graphics.addMany(polygonGraphics);
            view.goTo(polygonGraphics);
          } else {
            $("#total-results").hide();
            $("#ResultDiv").hide();
            $("#backButton").hide();
            $("#detailBox").hide();
            $("#filterDiv").hide();
            $("#layerListDiv").hide();
            $("#dropdown").show();
            $("#WelcomeBox").show();
            return;
          }
          // clickHandle = view.on("click", handleClick);
          if (!lasso && !select) {
            // add details and remove when search and no lasso
            if (DetailsHandle) {
              DetailsHandle?.remove();
              DetailsHandle = null;
            }

            if (clickHandle) {
              clickHandle?.remove();
              clickHandle = null;
            }

            if (clickHandle && select) {
              clickHandle?.remove();
              clickHandle = null;
            }
            $("#select-button").removeClass("btn-warning");
            DetailsHandle = view.on("click", handleDetailsClick);
          } else if ((!lasso && select) || (!select && lasso)) {
            if (clickHandle) {
              clickHandle.remove();
            }
            if (DetailsHandle) {
              DetailsHandle?.remove();
              DetailsHandle = null;
            }
            $("#select-button").addClass("btn-warning");
            clickHandle = view.on("click", handleClick);
          } else if (lasso && !select) {
            if (clickHandle) {
              clickHandle?.remove();
              clickHandle = null;
            }
            if (DetailsHandle) {
              DetailsHandle?.remove();
              DetailsHandle = null;
            }
            clickHandle = view.on("click", handleClick);
            $("#select-button").addClass("btn-warning");
          } else {
            // else add the select click, not the details
            // DetailsHandle = view.on("click", handleDetailsClick);
            if (clickHandle) {
              clickHandle?.remove();
              clickHandle = null;
            }
            if (DetailsHandle) {
              DetailsHandle?.remove();
              DetailsHandle = null;
            }
            $("#select-button").addClass("btn-warning");
            clickHandle = view.on("click", handleClick);
          }
        });
      });

      $(document).ready(function () {
        $("#detailsButton").on("click", function () {
          $("#detailBox").hide();
          $("#featureWid").hide();
          $("#result-btns").hide();
          $("#total-results").hide();
          $("#ResultDiv").hide();
          $("#filterDiv").hide();
          $("#layerListDiv").hide();
          $("#details-btns").show();
          $("#abut-mail").show();
          $("#detail-content").show();
          $("#detailBox").show();
          $("#backButton").show();
          $("#detailsButton").hide();
          $("#abutters-content").hide();
          $("#selected-feature").empty();
          $("#parcel-feature").empty();
          $("#exportResults").hide();
          $("#csvExportResults").hide();
          $("#csvExportSearch").hide();
          $("#exportSearch").hide();
          $("#exportButtons").hide();
          $("#abutters-title").html(`Abutting Parcels (0)`);
          $("#backButton-div").css("padding-top", "0px");
          $("#results-div").css("height", "300px");
          if (DetailsHandle) {
            DetailsHandle?.remove();
            DetailsHandle = null;
          }
          DetailsHandle = view.on("click", handleDetailsClick);
          // Find and remove the existing buffer graphic
          const existingBufferGraphicIndex = view.graphics.items.findIndex(
            (g) => g.id === bufferGraphicId
          );
          if (existingBufferGraphicIndex > -1) {
            view.graphics.removeAt(existingBufferGraphicIndex);
          }
        });
      });

      $(document).ready(function () {
        $("#abutters").on("click", function (e) {
          // clickHandle.remove();
          if (DetailsHandle) {
            DetailsHandle?.remove();
            DetailsHandle = null;
          }
          if (clickHandle) {
            clickHandle?.remove();
            clickHandle = null;
          }
          $("#results-div").css("height", "300px");
          $("#exportButtons").show();
          $("#exportResults").show();
          $("#exportSearch").hide();
          $("#csvExportResults").show();
          $("#csvExportSearch").hide();
          $("#WelcomeBox").hide();
          $("#detailBox").hide();
          $("#featureWid").hide();
          $("#result-btns").hide();
          $("#total-results").hide();
          $("#ResultDiv").hide();
          $("#details-btns").hide();
          $("#abut-mail").hide();
          $("#filterDiv").hide();
          $("#layerListDiv").hide();
          $("#abutters-content").show();
          $("#selected-feature").empty();
          $("#backButton").show();
          $("#detailsButton").show();
          $("#parcel-feature").empty();
          $("#backButton-div").css("padding-top", "78px");
          $("#abutters-title").html(`Abutting Parcels (0)`);
          buildAbuttersPanel(e);
          value.value = 100;
          runBuffer("100");
        });
      });

      $(document).ready(function () {
        $("#abutters-attributes").on("click", function (e) {
          // clickHandle.remove();
          if (DetailsHandle) {
            DetailsHandle?.remove();
            DetailsHandle = null;
          }
          if (clickHandle) {
            clickHandle?.remove();
            clickHandle = null;
          }
          $("#results-div").css("height", "300px");
          $("#exportButtons").show();
          $("#exportResults").show();
          $("#exportButtons").show();
          $("#exportSearch").hide();
          $("#csvExportResults").show();
          $("#csvExportSearch").hide();
          $("#WelcomeBox").hide();
          $("#detailBox").hide();
          $("#featureWid").hide();
          $("#result-btns").hide();
          $("#total-results").hide();
          $("#ResultDiv").hide();
          $("#details-btns").hide();
          $("#abut-mail").hide();
          $("#filterDiv").hide();
          $("#layerListDiv").hide();
          $("#abutters-content").show();
          $("#selected-feature").empty();
          $("#backButton").show();
          $("#detailsButton").show();
          $("#parcel-feature").empty();
          $("#backButton-div").css("padding-top", "78px");
          $("#abutters-title").html(`Abutting Parcels (0)`);
          buildAbuttersPanel(e);
          value.value = 100;
          runAttBuffer("100");
        });
      });

      $(document).ready(function () {
        $("#filterButton").on("click", function () {
          $("#WelcomeBox").hide();
          $("#exportResults").hide();
          $("#csvExportResults").hide();
          $("#detailBox").hide();
          $("#featureWid").hide();
          $("#result-btns").hide();
          $("#total-results").hide();
          $("#ResultDiv").hide();
          $("#details-btns").hide();
          $("#abut-mail").hide();
          $("#exportSearch").hide();
          $("#csvExportSearch").hide();
          $("#abutters-content").hide();
          $("#layerListDiv").hide();
          $("#selected-feature").empty();
          $("#backButton").hide();
          $("#detailsButton").hide();
          $("#dropdown").show();
          $("#filterDiv").show();
          $("#dropdown").toggleClass("expanded");
          $("#sidebar2").css("left", "0px");
          $("#sidebar2").addClass("collapsed");
          $("#results-div").css("left", "350px");
          $("#left-arrow-2").show();
          $("#right-arrow-2").hide();
          $("#results-div").css("height", "300px");
          $("#parcel-feature").empty();
          $("#backButton").show();
          $("#backButton-div").css("padding-top", "0px");
          $("#abutters-title").html(`Abutting Parcels (0)`);
          $(".center-container").show();
        });
      });

      $(document).ready(function () {
        $("#layerListBtn").on("click", function () {
          $("#WelcomeBox").hide();
          $("#exportResults").hide();
          $("#csvExportResults").hide();
          $("#detailBox").hide();
          $("#featureWid").hide();
          $("#result-btns").hide();
          $("#total-results").hide();
          $("#ResultDiv").hide();
          $("#details-btns").hide();
          $("#abut-mail").hide();
          $("#exportSearch").hide();
          $("#csvExportResults").hide();
          $("#csvExportSearch").hide();
          $("#exportButtons").hide();
          $("#abutters-content").hide();
          $("#selected-feature").empty();
          $("#backButton").hide();
          $("#detailsButton").hide();
          $("#dropdown").show();
          $("#filterDiv").hide();
          $("#backButton").show();
          $("#dropdown").toggleClass("expanded");
          $("#sidebar2").css("left", "0px");
          $("#sidebar2").addClass("collapsed");
          $("#results-div").css("left", "350px");
          $("#left-arrow-2").show();
          $("#right-arrow-2").hide();
          $("#results-div").css("height", "300px");
          $("#layerListDiv").show();
          // $("#detailsButton").show();
          $("#parcel-feature").empty();
          $("#backButton-div").css("padding-top", "0px");
          $("#abutters-title").html(`Abutting Parcels (0)`);
          $(".center-container").show();
        });
      });

      $("#layerListDiv").hide();

      $(document).ready(function () {
        $("#exportSearch").on("click", function (e) {
          e.stopPropagation();

          const printContainer = document.createElement("div");

          // Optionally, make this container invisible
          printContainer.style.visibility = "hidden";
          document.body.appendChild(printContainer);

          const resultsListGroup = document.createElement("ul");

          uniqueArray.forEach(function (feature) {
            let objectID = feature.objectid;
            let owner = feature.owner;
            let coOwner = feature.coOwner;
            let mailingAddress = feature.mailingAddress;
            let mailingAddress2 = feature.mailingAddress2;
            let Mailing_City = feature.Mailing_City;
            let Mail_State = feature.Mail_State;
            let Mailing_Zip = feature.Mailing_Zip;
            let Location = feature.location;
            let MBL = feature.MBL;
            const listItem = document.createElement("li");
            listItem.classList.add("export-search-list");
            let listItemHTML;

            listItemHTML = ` ${owner} ${coOwner} <br> MBL: ${MBL} <br> ${mailingAddress} <br> ${Mailing_City}, ${Mail_State} ${Mailing_Zip}`;

            listItem.innerHTML += listItemHTML;
            listItem.setAttribute("object-id", objectID);

            resultsListGroup.appendChild(listItem);
          });

          // Append the list to the print container
          printContainer.appendChild(resultsListGroup);

          ExportDetails("search");
          document.body.removeChild(printContainer);
        });
      });

      $(document).ready(function () {
        $("#csvExportResults").on("click", function (e) {
          e.stopPropagation();

          // Initialize headers for CSV
          const headers = [
            "Owner",
            "Co-Owner",
            "Mailing Address",
            "Mailing Address 2",
            "Mailing City",
            "Mailing State",
            "Mailing Zip",
            "MBL",
            "Location",
          ];

          // Create CSV content with row headers
          let csvContent = headers.join(",") + "\n";

          // Loop through each feature in foundLocs array
          exportCsv.forEach(function (feature) {
            let owner = feature.attributes["Owner"] || "";
            let coOwner = feature.attributes["Co_Owner"] || "";
            let mailingAddress = feature.attributes["Mailing_Address_1"] || "";
            let mailingAddress2 = feature.attributes["Mailing_Address_2"] || "";
            let Mailing_City = feature.attributes["Mailing_City"] || "";
            let Mail_State = feature.attributes["Mail_State"] || "";
            let Mailing_Zip = feature.attributes["Mailing_Zip"] || "";
            let Location = feature.attributes["Location"] || "";
            let MBL = feature.attributes["MBL"] || "";

            // Append data to CSV content
            csvContent += `"${owner}","${coOwner}","${mailingAddress}","${mailingAddress2}","${Mailing_City}","${Mail_State}","${Mailing_Zip}","${MBL}","${Location}"\n`;
          });

          // Create blob
          const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
          });

          // Convert blob to ArrayBuffer for upload
          const reader = new FileReader();
          reader.onload = function (event) {
            const arrayBuffer = event.target.result;
            getAccessTokenAndUpload(arrayBuffer);
          };
          reader.readAsArrayBuffer(blob);
        });

        function getAccessTokenAndUpload(arrayBuffer) {
          const clientId = "954e0858-9833-4b11-9d83-0bbef240a66c";
          const clientSecret = "0f3b00f2-24f7-47c2-ade7-5949d89f218c";
          const tenant = "5c577df5-09c2-4bb7-a1f3-241a6685b4aa";
          const siteUrl = "https://qualitydataservice.sharepoint.com";

          const tokenUrl = `https://accounts.accesscontrol.windows.net/${tenant}/tokens/OAuth/2`;
          const data = {
            grant_type: "client_credentials",
            client_id: `${clientId}@${tenant}`,
            client_secret: clientSecret,
            resource: siteUrl,
          };

          $.ajax({
            url: tokenUrl,
            type: "POST",
            data: data,
            success: function (response) {
              const accessToken = response.access_token;
              uploadCsvToSharePoint(arrayBuffer, accessToken);
            },
            error: function (error) {
              console.error("Error getting access token:", error);
            },
          });
        }

        function uploadCsvToSharePoint(arrayBuffer, accessToken) {
          const siteUrl = "https://qualitydataservice.sharepoint.com";
          const libraryName = "Shared Documents";
          const fileName = "export.csv";

          $.ajax({
            url: `${siteUrl}/_api/contextinfo`,
            type: "POST",
            headers: {
              Accept: "application/json; odata=verbose",
              Authorization: `Bearer ${accessToken}`,
              dataType: "jsonp",
            },
            success: function (data) {
              const formDigestValue =
                data.d.GetContextWebInformation.FormDigestValue;

              $.ajax({
                url: `${siteUrl}/_api/web/GetFolderByServerRelativeUrl('${libraryName}')/Files/add(url='${fileName}',overwrite=true)`,
                type: "POST",
                data: arrayBuffer,
                processData: false,
                headers: {
                  Accept: "application/json; odata=verbose",
                  "X-RequestDigest": formDigestValue,
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/octet-stream",
                  dataType: "jsonp",
                },
                success: function (data) {
                  const fileUrl = data.d.ServerRelativeUrl;
                  const embedUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
                    siteUrl + fileUrl
                  )}`;
                  window.open(embedUrl, "_blank");
                },
                error: function (error) {
                  console.error("Error uploading CSV to SharePoint:", error);
                },
              });
            },
            error: function (error) {
              console.error("Error getting form digest value:", error);
            },
          });
        }
      });

      $(document).ready(function () {
        $("#csvExportSearch").on("click", function (e) {
          e.stopPropagation();

          const headers = [
            "Owner",
            "Co-Owner",
            "Mailing Address",
            "Mailing Address 2",
            "Mailing City",
            "Mailing State",
            "Mailing Zip",
            "MBL",
            "Location",
          ];

          // Create CSV content with row headers
          let csvContent = headers.join(",") + "\n";

          uniqueArray.forEach(function (feature) {
            let owner = feature.owner || "";
            let coOwner = feature.coOwner || "";
            let mailingAddress = feature.mailingAddress || "";
            let mailingAddress2 = feature.mailingAddress2 || "";
            let Mailing_City = feature.Mailing_City || "";
            let Mail_State = feature.Mail_State || "";
            let Mailing_Zip = feature.Mailing_Zip
              ? `'${feature.Mailing_Zip.toString().padStart(5, "0")}'`
              : ""; // Ensure leading zeros are preserved
            let Location = feature.location || "";
            let MBL = feature.MBL || "";

            // Append data to CSV content
            csvContent += `"${owner}","${coOwner}","${mailingAddress}","${mailingAddress2}","${Mailing_City}","${Mail_State}","${Mailing_Zip}","${MBL}","${Location}"\n`;
          });

          // Create blob
          const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
          });

          // Create anchor element to download CSV
          const link = document.createElement("a");
          if (link.download !== undefined) {
            // Feature detection for download attribute
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "export.csv");
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        });
      });

      // EXPORT RESULTS
      $(document).ready(function () {
        $("#exportResults").on("click", function (e) {
          e.stopPropagation();

          const printContainer = document.createElement("div");

          // Optionally, make this container invisible
          printContainer.style.visibility = "hidden";
          document.body.appendChild(printContainer);

          const resultsListGroup = document.createElement("ul");

          uniqueArray.forEach(function (feature) {
            let objectID = feature.attributes.OBJECTID;
            let owner = feature.attributes.Owner;
            let coOwner = feature.attributes.Co_Owner;
            let mailingAddress = feature.attributes.Mailing_Address_1;
            let mailingAddress2 = feature.attributes.Mailing_Address_2;
            let Mailing_City = feature.attributes.Mailing_City;
            let Mail_State = feature.attributes.Mail_State;
            let Mailing_Zip = feature.attributes.Mailing_Zip;
            let Location = feature.location;
            let MBL = feature.attributes.MBL;

            const listItem = document.createElement("li");
            listItem.classList.add("abutters-group-list");

            let listItemHTML;

            listItemHTML = ` ${owner} ${coOwner} <br> MBL: ${MBL} <br> ${mailingAddress} <br> ${Mailing_City}, ${Mail_State} ${Mailing_Zip}`;

            listItem.innerHTML += listItemHTML;
            listItem.setAttribute("object-id", objectID);

            resultsListGroup.appendChild(listItem);
          });

          // Append the list to the print container
          printContainer.appendChild(resultsListGroup);

          ExportDetails("details");
          document.body.removeChild(printContainer);
        });
      });

      // ABUTTERS WIDGET
      $(document).ready(function () {
        $("#buffer-value").on("change", function (e) {
          e.stopPropagation();
          currentVal = value.value = parseInt(value.value);
          $("#parcel-feature").empty();
          bufferPush();
        });

        $("#increase").on("click", function (e) {
          e.stopPropagation();
          currentVal = value.value = parseInt(value.value) + 1;
          $("#parcel-feature").empty();
          bufferPush();
        });

        $("#decrease").on("click", function (e) {
          e.stopPropagation();
          currentVal = value.value = parseInt(value.value) - 1;
          $("#parcel-feature").empty();
          bufferPush();
        });

        $("#submit").on("click", function (e) {
          e.stopPropagation();
          e.preventDefault();
          currentVal = value.value = parseInt(value.value);
          $("#parcel-feature").empty();
          bufferPush();
        });

        // Handler for keypress event on the input field
        $("#buffer-value").on("keypress", function (e) {
          if (e.which == 13) {
            currentVal = value.value = parseInt(value.value); // 13 is the Enter key
            e.preventDefault();
            bufferPush();
          }
        });

        let debounceTimer;
        function bufferPush() {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            runAttBuffer(currentVal);
          }, 200);
        }

        $(".units").on("click", function (e) {
          if (e.target.value == "feet") {
            queryUnits = "feet";
            $("#unitSelector").html(queryUnits);
          } else {
            queryUnits = "meters";
            $("#unitSelector").html(queryUnits);
          }
        });
      });

      function ExportDetails(type) {
        var listItems;
        if (type === "search") {
          listItems = document.querySelectorAll(".export-search-list");
        } else {
          listItems = document.querySelectorAll(".abutters-group-list");
        }

        const originalContents = [];

        document.querySelectorAll(".search-list").forEach(function (li, index) {
          // Store the original HTML of each list item
          originalContents[index] = li.innerHTML;
        });

        var transformedContent = "<ul class='label-list'>";
        listItems.forEach(function (item) {
          transformedContent += "<li>" + item.innerHTML.trim() + "</li>"; // Trim to remove any extra whitespace
        });

        transformedContent += "</ul>";

        var style = "<style>";
        style += "body { margin: 0; padding: 0; font-size: 10pt; }";
        style +=
          ".label-list { list-style-type: none; margin: 0; padding: 0; display: flex; align-items: center; text-align: center; flex-wrap: wrap; justify-content: space-between; }";
        style +=
          ".label-list li { box-sizing: border-box; width: 2.225in; height: 1in; margin-bottom: 0.0in; padding: 0.1in; display: flex; align-items: center; justify-content: center; font-size: 8pt; }"; // Updated for centering text
        style += "@media print {";
        style += "  body { margin: 0.0in 0.1875in; }"; // Adjusted body margin for print
        style += "  .label-list { padding: 0; }";
        style += "  .label-list li { margin-right: 0in; margin-bottom: 0; }"; // Remove right margin on labels
        style +=
          "  @page { margin-top: 0.5in; margin-bottom: 0.5in; margin-left: 0.25in; margin-right: 0.25in }"; // Adjust as needed for your printer
        style += "}";
        style += "</style>";

        var win = window.open(
          "",
          "print",
          "left=0,top=0,width=800,height=600,toolbar=0,status=0"
        );

        win.document.write("<!DOCTYPE html><html><head>");
        win.document.write("<title>Print Labels</title>");
        win.document.write(style);
        win.document.write("</head><body>");
        win.document.write(transformedContent);
        win.document.write("</body></html>");
        win.document.close();

        setTimeout(() => {
          win.print();
          win.close();
          document
            .querySelectorAll(".search-list")
            .forEach(function (li, index) {
              if (originalContents[index]) {
                li.innerHTML = originalContents[index];
              }
            });
        }, 250);
      }

      function queryAttDetailsBuffer(geometry) {
        const parcelQuery = {
          spatialRelationship: "intersects", // Relationship operation to apply
          geometry: geometry, // The sketch feature geometry
          outFields: ["*"], // Attributes to return
          returnGeometry: true,
          units: queryUnits,
        };
        let bufferResults = [];

        if (sessionStorage.getItem("condos") === "no") {
          noCondosLayer.queryFeatures(parcelQuery).then((results) => {
            const bufferRes = results.features;
            bufferRes.forEach((parcel) => {
              bufferResults.push(parcel.attributes.GIS_LINK);
            });

            buildAndQueryTable(bufferResults);
          });
        } else {
          CondosLayer.queryFeatures(parcelQuery).then((results2) => {
            const bufferRes = results2.features;
            bufferRes.forEach((parcel) => {
              bufferResults.push(parcel.attributes.GIS_LINK);
            });
            buildAndQueryTable(bufferResults);
          });
        }
      }

      function buildAndQueryTable(bufferResults) {
        if (bufferResults.length > 0) {
          const queryValues = bufferResults
            .map((value) => `'${value}'`)
            .join(" OR GIS_LINK = ");
          const queryString = `GIS_LINK = ${queryValues}`;

          let query = CondosTable.createQuery();
          query.where = queryString;
          query.returnGeometry = false;
          query.returnHiddenFields = true; // Adjust based on your needs
          query.outFields = ["*"];

          CondosTable.queryFeatures(query).then((response) => {
            buildPanel(response);
          });
        } else {
          console.log("No buffer results to query.");
        }
      }

      function buildPanel(results) {
        const abuttersDiv = document.getElementById("parcel-feature");
        abuttersDiv.innerHTML = "";

        const foundLocs = results.features;
        totalResults = foundLocs.length;
        lastResults = totalResults;
        exportResults = foundLocs;
        uniqueArray = foundLocs;
        exportCsv = foundLocs;

        foundLocs.forEach(function (feature) {
          let locationGISLINK = feature.attributes["GIS_LINK"];
          let objectID = feature.attributes["OBJECTID"];
          let owner = feature.attributes["Owner"];
          let coOwner = feature.attributes["Co_Owner"];
          let mailingAddress = feature.attributes["Mailing_Address_1"];
          let mailingAddress2 = feature.attributes["Mailing_Address_2"];
          let Mailing_City = feature.attributes["Mailing_City"];
          let Mail_State = feature.attributes["Mail_State"];
          let Mailing_Zip = feature.attributes["Mailing_Zip"];

          const listGroup = document.createElement("ul");
          listGroup.classList.add("row");
          listGroup.classList.add("list-group");
          listGroup.classList.add("abutters-list");

          const listItem = document.createElement("li");
          listItem.classList.add("abutters-group-item", "col-12");

          let listItemHTML = "";

          listItemHTML = ` ${owner} ${coOwner} <br> ${mailingAddress} ${mailingAddress2} <br> ${Mailing_City}, ${Mail_State} ${Mailing_Zip}`;

          // Append the new list item to the list
          listItem.innerHTML += listItemHTML;

          listItem.setAttribute("data-id", locationGISLINK);
          listItem.setAttribute("object-id", objectID);

          listGroup.appendChild(listItem);
          abuttersDiv.appendChild(listGroup);
          $("#abutters-spinner").hide();
          $("#abutters-title").html(`Abutting Parcels (${totalResults})`);
        });
        $("#results-div").css("height", "300px");
        $("#exportResults").show();
        $("#csvExportResults").show();
      }

      // THIS IS WHERE YOU WOULD MAKE UNITS A VARIABLE FOR USER SELECTION
      function queryDetailsBuffer(geometry) {
        // Loader.open();
        let bothResults = [];

        const abuttersDiv = document.getElementById("parcel-feature");
        abuttersDiv.innerHTML = "";

        const parcelQuery = {
          spatialRelationship: "intersects", // Relationship operation to apply
          geometry: geometry, // The sketch feature geometry
          outFields: ["*"], // Attributes to return
          returnGeometry: true,
          units: queryUnits,
        };

        exportResults = [];

        if (sessionStorage.getItem("condos") === "no") {
          noCondosLayer.queryFeatures(parcelQuery).then((results) => {
            bothResults = [...results.features];

            const seenLocations = new Set();

            let noDupBothResults = bothResults.filter((item) => {
              if (seenLocations.has(item.attributes.OBJECTID)) {
                return false;
              }
              seenLocations.add(item.attributes.OBJECTID);
              return true;
            });

            let foundLocs = bothResults.filter((element) =>
              seenLocations.has(element.attributes.OBJECTID)
            );

            totalResults = bothResults.length;
            let noResultDups = bothResults;

            let finalResults = noResultDups.filter(
              (item, index) => noResultDups.indexOf(item) === index
            );

            lastResults = finalResults;

            exportResults = bothResults;

            let listItemHTML = "";

            exportCsv = foundLocs;

            // console.log(lastResults);
            foundLocs.forEach(function (feature) {
              let locationGISLINK = feature.attributes["GIS_LINK"];
              let objectID = feature.attributes["OBJECTID"];
              let owner = feature.attributes["Owner"];
              let coOwner = feature.attributes["Co_Owner"];
              let mailingAddress = feature.attributes["Mailing_Address_1"];
              let mailingAddress2 = feature.attributes["Mailing_Address_2"];
              let Mailing_City = feature.attributes["Mailing_City"];
              let Mail_State = feature.attributes["Mail_State"];
              let Mailing_Zip = feature.attributes["Mailing_Zip"];

              const listGroup = document.createElement("ul");
              listGroup.classList.add("row");
              listGroup.classList.add("list-group");
              listGroup.classList.add("abutters-list");

              const listItem = document.createElement("li");
              listItem.classList.add("abutters-group-item", "col-12");

              let listItemHTML = "";

              listItemHTML = ` ${owner} ${coOwner} <br> ${mailingAddress} ${mailingAddress2} <br> ${Mailing_City}, ${Mail_State} ${Mailing_Zip}`;

              // Append the new list item to the list
              listItem.innerHTML += listItemHTML;

              listItem.setAttribute("data-id", locationGISLINK);
              listItem.setAttribute("object-id", objectID);

              listGroup.appendChild(listItem);
              abuttersDiv.appendChild(listGroup);
              $("#abutters-spinner").hide();
              $("#abutters-title").html(`Abutting Parcels (${totalResults})`);
            });
          });
        } else {
          CondosLayer.queryFeatures(parcelQuery).then((results2) => {
            bothResults = [...results2.features];

            const seenLocations = new Set();

            let noDupBothResults = bothResults.filter((item) => {
              if (seenLocations.has(item.attributes.OBJECTID)) {
                return false;
              }
              seenLocations.add(item.attributes.OBJECTID);
              return true;
            });

            let foundLocs = bothResults.filter((element) =>
              seenLocations.has(element.attributes.OBJECTID)
            );

            totalResults = bothResults.length;
            let noResultDups = bothResults;

            let finalResults = noResultDups.filter(
              (item, index) => noResultDups.indexOf(item) === index
            );

            lastResults = finalResults;
            exportResults = bothResults;
            let listItemHTML = "";
            exportCsv = foundLocs;

            foundLocs.forEach(function (feature) {
              let locationGISLINK = feature.attributes["GIS_LINK"];
              let objectID = feature.attributes["OBJECTID"];
              let owner = feature.attributes["Owner"];
              let coOwner = feature.attributes["Co_Owner"];
              let mailingAddress = feature.attributes["Mailing_Address_1"];
              let mailingAddress2 = feature.attributes["Mailing_Address_2"];
              let Mailing_City = feature.attributes["Mailing_City"];
              let Mail_State = feature.attributes["Mail_State"];
              let Mailing_Zip = feature.attributes["Mailing_Zip"];

              const listGroup = document.createElement("ul");
              listGroup.classList.add("row");
              listGroup.classList.add("list-group");
              listGroup.classList.add("abutters-list");

              const listItem = document.createElement("li");
              listItem.classList.add("abutters-group-item", "col-12");

              let listItemHTML = "";

              listItemHTML = ` ${owner} ${coOwner} <br> ${mailingAddress} ${mailingAddress2} <br> ${Mailing_City}, ${Mail_State} ${Mailing_Zip}`;

              // Append the new list item to the list
              listItem.innerHTML += listItemHTML;

              listItem.setAttribute("data-id", locationGISLINK);
              listItem.setAttribute("object-id", objectID);

              listGroup.appendChild(listItem);
              abuttersDiv.appendChild(listGroup);
              $("#abutters-spinner").hide();
              $("#abutters-title").html(`Abutting Parcels (${totalResults})`);
            });
          });
        }
        $("#results-div").css("height", "300px");
        $("#exportResults").show();
        $("#csvExportResults").show();
      }

      function addOrUpdateBufferGraphic(bufferResults) {
        bufferGraphicId = "BufferGraphicId";

        let fillSymbol = {
          type: "simple-fill",
          color: [51, 51, 204, 0.1],
          style: "forward-diagonal",
          outline: {
            color: "rgba(127, 42, 145, 0.8)",
            width: 4,
          },
        };

        // Find and remove the existing buffer graphic
        const existingBufferGraphicIndex = view.graphics.items.findIndex(
          (g) => g.id === bufferGraphicId
        );
        if (existingBufferGraphicIndex > -1) {
          view.graphics.removeAt(existingBufferGraphicIndex);
        }

        // Add new buffer graphic
        let newBufferGraphic = new Graphic({
          geometry: bufferResults,
          symbol: fillSymbol,
          id: bufferGraphicId, // Assigning the unique ID
        });
        view.graphics.add(newBufferGraphic);
        view.goTo({
          target: newBufferGraphic,
          zoom: oldZoom,
        });
      }

      function runAttBuffer(value) {
        $("#abutters-spinner").show();
        // console.log(detailsGeometry);
        if (value === 0) {
          value = -10;
        }
        let buffer = value;
        let unit = queryUnits;
        let bufferResults;
        let targetExtent;

        if (sessionStorage.getItem("condos") === "no") {
          bufferResults = geometryEngine.buffer(detailsGeometry, buffer, unit);
          // console.log(`no condos buffer run`);
        } else {
          bufferResults = geometryEngine.buffer(detailsGeometry, buffer, unit);
          // console.log(`condos buffer run`);
        }

        addOrUpdateBufferGraphic(bufferResults);
        queryAttDetailsBuffer(bufferResults);
      }

      function runBuffer(value) {
        $("#abutters-spinner").show();
        // console.log(detailsGeometry);
        let buffer = value;
        let unit = queryUnits;
        let bufferResults;

        if (sessionStorage.getItem("condos") == "no") {
          bufferResults = geometryEngine.buffer(targetExtent, buffer, unit);
        } else {
          bufferResults = geometryEngine.buffer(detailsGeometry, buffer, unit);
        }

        addOrUpdateBufferGraphic(bufferResults);
        queryDetailsBuffer(bufferResults);
      }

      function clickDetailsPanel(item) {
        $("#select-button").prop("disabled", true);
        $("#select-button").removeClass("btn-warning");
        detailsHandleUsed = "detailClick";
        $("#detail-content").empty();
        $("#selected-feature").empty();
        $(".center-container").hide();
        $("#layerListDiv").hide();
        function formatNumber(value) {
          if (value === undefined) return "";
          return new Intl.NumberFormat("en-US").format(value);
        }

        let features = item[0].attributes;
        // console.log(features);
        let Location = features.Location === undefined ? "" : features.Location;
        let locationUniqueId =
          features.Uniqueid === undefined ? "" : features.Uniqueid;
        let locationGIS_LINK =
          features.GIS_LINK === undefined ? "" : features.GIS_LINK;
        let locationCoOwner =
          features.Co_Owner === undefined ? "" : features.Co_Owner;
        let locationOwner = features.Owner === undefined ? "" : features.Owner;
        let locationMBL = features.MBL === undefined ? "" : features.MBL;
        let mailingAddress =
          features.Mailing_Address_1 === undefined
            ? ""
            : features.Mailing_Address_1;
        let Mailing_City =
          features.Mailing_City === undefined
            ? ""
            : features.Mailing_City + ", ";
        let Mail_State =
          features.Mail_State === undefined ? "" : features.Mail_State;
        let Mailing_Zip =
          features.Mailing_Zip === undefined ? "" : features.Mailing_Zip;
        let Total_Acres =
          features.Total_Acres === undefined ? "" : features.Total_Acres;
        let Parcel_Primary_Use =
          features.Parcel_Primary_Use === undefined
            ? ""
            : features.Parcel_Primary_Use;
        let Building_Use_Code =
          features.Building_Use_Code === undefined
            ? ""
            : features.Building_Use_Code;
        let Parcel_Type =
          features.Parcel_Type === undefined ? "" : features.Parcel_Type;
        let Design_Type =
          features.Design_Type === undefined ? "" : features.Design_Type;
        let Zoning = features.Zoning === undefined ? "" : features.Zoning;
        let Neighborhood =
          features.Neighborhood === undefined ? "" : features.Neighborhood;
        let Land_Type_Rate =
          features.Land_Type_Rate === undefined ? "" : features.Land_Type_Rate;
        let Functional_Obs =
          features.Functional_Obs === undefined ? "" : features.Functional_Obs;
        let External_Obs =
          features.External_Obs === undefined ? "" : features.External_Obs;
        let orig_date = features.Sale_Date;
        let Sale_Date =
          features.Sale_Date === undefined ? "" : formatDate(orig_date);
        let Sale_Price =
          features.Sale_Price === undefined
            ? ""
            : formatNumber(features.Assessed_Total);
        let Vol_Page = features.Vol_Page === undefined ? "" : features.Vol_Page;
        // Usage example with your existing code
        let Assessed_Total =
          features.Assessed_Total === undefined
            ? ""
            : formatNumber(features.Assessed_Total);
        let Appraised_Total =
          features.Appraised_Total === undefined
            ? ""
            : formatNumber(features.Appraised_Total);
        let Prior_Appraised_Total =
          features.Prior_Appraised_Total === undefined
            ? ""
            : formatNumber(features.Prior_Appraised_Total);
        let Prior_Assessed_Total =
          features.Prior_Assessed_Total === undefined
            ? ""
            : formatNumber(features.Prior_Assessed_Total);

        let Prior_Assessment_Year =
          features.Prior_Assessment_Year === undefined
            ? ""
            : features.Prior_Assessment_Year;
        let map_pdf = features.Map === undefined ? "" : $.trim(features.Map);

        let objectID2 =
          features.OBJECTID === undefined ? "" : features.OBJECTID;

        let Lat = features.Lat === undefined ? "" : features.Lat;
        let Lon = features.Lon === undefined ? "" : features.Lon;
        let Id;

        if (configVars.useUniqueIdforParcelMap === "yes") {
          zoomToItemId = locationUniqueId;
          Id = locationUniqueId;
        } else {
          zoomToItemId = locationGIS_LINK;
          Id = locationGIS_LINK;
        }

        // zoomToItemId = locationUniqueId;
        zoomToObjectID = objectID2;

        const imageUrl = `${configVars.imageUrl}${locationUniqueId}.jpg`;
        // console.log(matchedObject);

        const detailsDiv = document.getElementById("detail-content");

        const details = document.createElement("div");
        details.innerHTML = "";
        details.classList.add("details");

        details.innerHTML = `
        <p>
        <span style="font-family:Tahoma;font-size:14px;"><strong>${Location}</strong></span> <br>
        </p>

        <div>
        <img class="image" src=${configVars.imageUrl}${locationUniqueId}.jpg alt="Building Photo" width="250" height="125"><br>
        </div>
        <p>
        <span style="font-family:Tahoma;font-size:12px;"><strong>${locationOwner} ${locationCoOwner}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;"><strong>${mailingAddress}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;"><strong>${Mailing_City} ${Mail_State} ${Mailing_Zip}</strong></span><br>

        </p>
        <p>
        <span style="font-family:Tahoma;font-size:12px;">Unique ID: <strong>${locationUniqueId}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">MBL: <strong>${locationMBL}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Total Acres: <strong>${Total_Acres}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Primary Use: <strong>${Parcel_Primary_Use}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Primary Bldg Use: <strong>${Building_Use_Code}</strong></span><br>

        </p>
        <p>
        <span style="font-family:Tahoma;font-size:12px;"><strong>Latest Qualified Sale:</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Sold on: <strong>${Sale_Date}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Sale Price: <strong>$${Sale_Price}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Volume/Page: <strong>${Vol_Page}</strong></span><br>

        </p>
        <p>
        <span style="font-family:Tahoma;font-size:12px;"><strong>Valuations:</strong></span><br>
        <span style="font-family:Tahoma;font-size:12px;">GL Year: <strong>${Prior_Assessment_Year}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Assessment: <strong>$${Prior_Assessed_Total}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Appraised: <strong>$${Prior_Appraised_Total}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;"></span>
        </p>
        <p>   
        <a target="_blank" rel="noopener noreferrer" href=${configVars.propertyCard}&amp;uniqueid=${locationUniqueId}><span style="font-family:Tahoma;font-size:12px;"><strong>Property Card</strong></span></a><br>
        <a target="_blank" rel="noopener noreferrer" href=https://publicweb-gis.s3.amazonaws.com/PDFs/${configVars.parcelMapUrl}/Quick_Maps/QM_${Id}.pdf><span style="font-family:Tahoma;font-size:12px;"><strong>Parcel Map</strong></span></a><span style="font-family:Tahoma;font-size:12px;"> </span><br>
        <a target="_blank" rel="noopener noreferrer" href=${configVars.taxMap_Url}${map_pdf}.pdf><span style="font-family:Tahoma;font-size:12px;"><strong>Tax Map</strong></span></a><br>
        <a target="_blank" rel="noopener noreferrer" href=${configVars.tax_bill}&amp;uniqueId=${locationUniqueId}><span style="font-family:Tahoma;font-size:12px;"><strong>Tax Bills</strong></span></a><br>
        <a target="_blank" rel="noopener noreferrer" href=${configVars.pdf_demo}><span style="font-family:Tahoma;font-size:12px;"><strong>Demographics Profile</strong></span></a><br>
        <a target="_blank" rel="noopener noreferrer" href=${configVars.housingUrl}><span style="font-family:Tahoma;font-size:12px;"><strong>Housing Profile</strong></span></a><br>
        <a target="_blank" rel="noopener noreferrer" href=https://www.google.com/maps/@${Lat},${Lon},17z/@${Lat},${Lon},17z/data=!5m1!1e2><span style="font-family:Tahoma;font-size:12px;"><strong>View in Google Maps</strong></span></a><br>
        <a target="_blank" rel="noopener noreferrer" href=https://www.bing.com/maps?cp=${Lat}~${Lon}&lvl=17.0><span style="font-family:Tahoma;font-size:12px;"><strong>View in Bing Maps</strong></span></a><br>
              
        `;
        $("#details-spinner").hide();
        detailsDiv.appendChild(details);
      }

      $(document).ready(function () {
        // Add click event listener to the dynamically generated buttons with class 'justZoom'
        $(document).on("click", ".abutters-zoom", function (event) {
          event.stopPropagation();
          event.preventDefault();

          if (sessionStorage.getItem("condos") === "no") {
            // If the key doesn't exist, set it to "none"
            let whereClause = `OBJECTID = ${zoomToObjectID}`;
            let query = noCondosLayer.createQuery();
            query.where = whereClause;
            query.returnGeometry = true;
            query.returnHiddenFields = true; // Adjust based on your needs
            query.outFields = ["*"];

            noCondosLayer.queryFeatures(query).then((response) => {
              let feature = response;
              let geometry = feature.features[0].geometry;

              // Get the extent of the geometry
              const geometryExtent = geometry.extent;

              // Calculate the center of the geometry
              const center = geometryExtent.center;

              // Calculate a new extent with a slightly zoomed-out level
              const zoomOutFactor = 3.0; // Adjust as needed
              const newExtent = geometryExtent.expand(zoomOutFactor);

              // Set the view to the new extent
              view.goTo({
                target: center, // Center the view on the center of the geometry
                extent: newExtent, // Set the extent to the new adjusted extent
              });
            });
          } else {
            let whereClause = `OBJECTID = ${zoomToObjectID}`;
            // let whereClause = `GIS_LINK = '${matchingObject[0].GIS_LINK}'`;
            let query = CondosLayer.createQuery();
            query.where = whereClause;
            query.returnGeometry = true;
            query.returnHiddenFields = true; // Adjust based on your needs
            query.outFields = ["*"];

            CondosLayer.queryFeatures(query).then((response) => {
              let feature = response;
              let geometry = feature.features[0].geometry;

              // Get the extent of the geometry
              const geometryExtent = geometry.extent;

              // Calculate the center of the geometry
              const center = geometryExtent.center;

              // Calculate a new extent with a slightly zoomed-out level
              const zoomOutFactor = 3.0; // Adjust as needed
              const newExtent = geometryExtent.expand(zoomOutFactor);

              // Set the view to the new extent
              view.goTo({
                target: center, // Center the view on the center of the geometry
                extent: newExtent, // Set the extent to the new adjusted extent
              });
            });
            // You can perform any actions you want here, such as zooming to a location
          }
        });
      });

      function buildDetailsPanel(objectId, itemId) {
        $("#select-button").prop("disabled", true);
        $("#select-button").removeClass("btn-warning");

        function formatNumber(value) {
          if (value === undefined) return "";
          return new Intl.NumberFormat("en-US").format(value);
        }

        if (clickHandle) {
          clickHandle?.remove();
          clickHandle = null;
        }

        detailsHandleUsed = "detailClick";
        $("#exportResults").hide();
        $("#csvExportResults").hide();
        detailSelected = [objectId, itemId];

        var matchedObject;

        matchedObject = firstList.find(function (item) {
          return item.objectid === parseInt(objectId);
        });

        if (!matchedObject) {
          matchedObject = firstList.find(function (item) {
            return item.GIS_LINK === itemId || item.uniqueId === itemId;
          });
        }
        let Location =
          matchedObject.location === undefined ? "" : matchedObject.location;
        let locationUniqueId =
          matchedObject.uniqueId === undefined ? "" : matchedObject.uniqueId;
        let locationGIS_LINK =
          matchedObject.GIS_LINK === undefined ? "" : matchedObject.GIS_LINK;
        let locationCoOwner =
          matchedObject.coOwner === undefined ? "" : matchedObject.coOwner;
        let locationOwner =
          matchedObject.owner === undefined ? "" : matchedObject.owner;
        let locationMBL =
          matchedObject.MBL === undefined ? "" : matchedObject.MBL;
        let mailingAddress =
          matchedObject.mailingAddress === undefined
            ? ""
            : matchedObject.mailingAddress;
        let Mailing_City =
          matchedObject.Mailing_City === undefined
            ? ""
            : matchedObject.Mailing_City + ", ";
        let Mail_State =
          matchedObject.Mail_State === undefined
            ? ""
            : matchedObject.Mail_State;
        let Mailing_Zip =
          matchedObject.Mailing_Zip === undefined
            ? ""
            : matchedObject.Mailing_Zip;
        let Total_Acres =
          matchedObject.Total_Acres === undefined
            ? ""
            : matchedObject.Total_Acres;

        let AcreCheck = Number(Total_Acres);
        let Parcel_Primary_Use =
          matchedObject.Parcel_Primary_Use === undefined
            ? ""
            : matchedObject.Parcel_Primary_Use;
        let Building_Use_Code =
          matchedObject.Building_Use_Code === undefined
            ? ""
            : matchedObject.Building_Use_Code;
        let Parcel_Type =
          matchedObject.Parcel_Type === undefined
            ? ""
            : matchedObject.Parcel_Type;
        let Design_Type =
          matchedObject.Design_Type === undefined
            ? ""
            : matchedObject.Design_Type;
        let Zoning =
          matchedObject.Zoning === undefined ? "" : matchedObject.Zoning;
        let Neighborhood =
          matchedObject.Neighborhood === undefined
            ? ""
            : matchedObject.Neighborhood;
        let Land_Type_Rate =
          matchedObject.Land_Type_Rate === undefined
            ? ""
            : matchedObject.Land_Type_Rate;
        let Functional_Obs =
          matchedObject.Functional_Obs === undefined
            ? ""
            : matchedObject.Functional_Obs;
        let External_Obs =
          matchedObject.External_Obs === undefined
            ? ""
            : matchedObject.External_Obs;
        let Sale_Date =
          matchedObject.Sale_Date === undefined ? "" : matchedObject.Sale_Date;

        let Sale_Price =
          matchedObject.Sale_Price === undefined
            ? ""
            : formatNumber(matchedObject.Sale_Price);
        let Vol_Page =
          matchedObject.Vol_Page === undefined ? "" : matchedObject.Vol_Page;
        let Assessed_Total =
          matchedObject.Assessed_Total === undefined
            ? ""
            : formatNumber(matchedObject.Assessed_Total);
        let Appraised_Total =
          matchedObject.Appraised_Total === undefined
            ? ""
            : formatNumber(matchedObject.Appraised_Total);

        let Prior_Appraised_Total =
          matchedObject.Prior_Appraised_Total === undefined
            ? ""
            : formatNumber(matchedObject.Prior_Appraised_Total);

        let Prior_Assessed_Total =
          matchedObject.Prior_Assessed_Total === undefined
            ? ""
            : formatNumber(matchedObject.Prior_Assessed_Total);

        let Prior_Assessment_Year =
          matchedObject.Prior_Assessment_Year === undefined
            ? ""
            : matchedObject.Prior_Assessment_Year;
        let locationGeom =
          matchedObject.geometry === undefined ? "" : matchedObject.geometry;

        let map_pdf =
          matchedObject.Map === undefined ? "" : $.trim(matchedObject.Map);
        let objectID2 =
          matchedObject.objectid === undefined ? "" : matchedObject.objectid;

        let Lat = matchedObject.LAT === undefined ? "" : matchedObject.LAT;
        let Lon = matchedObject.LON === undefined ? "" : matchedObject.LON;
        let Id;

        if (configVars.useUniqueIdforParcelMap === "yes") {
          zoomToItemId = locationUniqueId;
          Id = locationUniqueId;
        } else {
          zoomToItemId = locationGIS_LINK;
          Id = locationGIS_LINK;
        }
        console.log(Parcel_Type);

        // if (
        //   !locationGeom ||
        //   locationGeom == "" ||
        //   (locationGeom == undefined && Total_Acres === 0)
        // ) {
        //   $("#abutters-attributes").prop("disabled", true);
        //   $("#abutters-zoom").prop("disabled", true);
        // } else {
        //   $("#abutters-attributes").prop("disabled", false);
        //   $("#abutters-zoom").prop("disabled", false);
        // }

        // zoomToItemId = locationUniqueId;
        zoomToObjectID = objectID2;

        const imageUrl = `https://publicweb-gis.s3.amazonaws.com/Images/Bldg_Photos/Washington_CT/${locationUniqueId}.jpg`;
        const detailsDiv = document.getElementById("detail-content");
        const details = document.createElement("div");

        details.innerHTML = "";
        details.classList.add("details");

        details.innerHTML = `
    <p>
    <span style="font-family:Tahoma;font-size:14px;"><strong>${Location}</strong></span> <br>
    </p>

    <div>
    <img class="image" src=${configVars.imageUrl}${locationUniqueId}.jpg alt="Building Photo" width="250" height="125"><br>
    </div>
    <p>
    <span style="font-family:Tahoma;font-size:12px;"><strong>${locationOwner} ${locationCoOwner}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;"><strong>${mailingAddress}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;"><strong>${Mailing_City} ${Mail_State} ${Mailing_Zip}</strong></span><br>

    </p>
    <p>
    <span style="font-family:Tahoma;font-size:12px;">Unique ID: <strong>${locationUniqueId}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">MBL: <strong>${locationMBL}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Total Acres: <strong>${Total_Acres}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Primary Use: <strong>${Parcel_Primary_Use}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Primary Bldg Use: <strong>${Building_Use_Code}</strong></span><br>

    </p>
    <p>
    <span style="font-family:Tahoma;font-size:12px;"><strong>Latest Qualified Sale:</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Sold on: <strong>${Sale_Date}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Sale Price: <strong>$${Sale_Price}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Volume/Page: <strong>${Vol_Page}</strong></span><br>

    </p>
    <p>
    <span style="font-family:Tahoma;font-size:12px;"><strong>Valuations:</strong></span><br>
    <span style="font-family:Tahoma;font-size:12px;">GL Year: <strong>${Prior_Assessment_Year}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Assessment: <strong>$${Prior_Assessed_Total}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Appraised: <strong>$${Prior_Appraised_Total}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;"></span>
    </p>
    <p>
    <a target="_blank" rel="noopener noreferrer" href=${configVars.propertyCard}&amp;uniqueid=${locationUniqueId}><span style="font-family:Tahoma;font-size:12px;"><strong>Property Card</strong></span></a><br>
    <a target="_blank" rel="noopener noreferrer" href=https://publicweb-gis.s3.amazonaws.com/PDFs/${configVars.parcelMapUrl}/Quick_Maps/QM_${Id}.pdf><span style="font-family:Tahoma;font-size:12px;"><strong>Parcel Map</strong></span></a><span style="font-family:Tahoma;font-size:12px;"> </span><br>
    <a target="_blank" rel="noopener noreferrer" href=${configVars.taxMap_Url}${map_pdf}.pdf><span style="font-family:Tahoma;font-size:12px;"><strong>Tax Map</strong></span></a><br>
    <a target="_blank" rel="noopener noreferrer" href=${configVars.tax_bill}&amp;uniqueId=${locationUniqueId}><span style="font-family:Tahoma;font-size:12px;"><strong>Tax Bills</strong></span></a><br>
    <a target="_blank" rel="noopener noreferrer" href=${configVars.pdf_demo}><span style="font-family:Tahoma;font-size:12px;"><strong>Demographics Profile</strong></span></a><br>
    <a target="_blank" rel="noopener noreferrer" href=${configVars.housingUrl}><span style="font-family:Tahoma;font-size:12px;"><strong>Housing Profile</strong></span></a><br>
    <a target="_blank" rel="noopener noreferrer" href=https://www.google.com/maps/@${Lat},${Lon},17z/@${Lat},${Lon},17z/data=!5m1!1e2><span style="font-family:Tahoma;font-size:12px;"><strong>View in Google Maps</strong></span></a><br>
    <a target="_blank" rel="noopener noreferrer" href=https://www.bing.com/maps?cp=${Lat}~${Lon}&lvl=17.0><span style="font-family:Tahoma;font-size:12px;"><strong>View in Bing Maps</strong></span></a><br>
          
    `;

        $("#details-spinner").hide();
        detailsDiv.appendChild(details);

        // $(document).ready(function () {
        //   // Add click event listener to the dynamically generated buttons with class 'justZoom'
        //   $(document).on("click", ".abutters-zoom", function (event) {
        //     event.stopPropagation();
        //     event.preventDefault();

        //     // let targetElement = event.target.closest("li");
        //     let itemId = locationUniqueId;
        //     let objectID = objectID2;

        //     console.log(itemId);
        //     console.log(objectID);

        //     if (sessionStorage.getItem(key) === "no") {
        //       // If the key doesn't exist, set it to "none"
        //       let whereClause = `OBJECTID = ${objectID}`;
        //       let query = noCondosLayer.createQuery();
        //       query.where = whereClause;
        //       query.returnGeometry = true;
        //       query.returnHiddenFields = true; // Adjust based on your needs
        //       query.outFields = ["*"];

        //       noCondosLayer.queryFeatures(query).then((response) => {
        //         let feature = response;
        //         let geometry = feature.features[0].geometry;

        //         // Get the extent of the geometry
        //         const geometryExtent = geometry.extent;

        //         // Calculate the center of the geometry
        //         const center = geometryExtent.center;

        //         // Calculate a new extent with a slightly zoomed-out level
        //         const zoomOutFactor = 3.0; // Adjust as needed
        //         const newExtent = geometryExtent.expand(zoomOutFactor);

        //         // Set the view to the new extent
        //         view.goTo({
        //           target: center, // Center the view on the center of the geometry
        //           extent: newExtent, // Set the extent to the new adjusted extent
        //         });
        //       });
        //     } else {
        //       let whereClause = `OBJECTID = ${objectID}`;
        //       // let whereClause = `GIS_LINK = '${matchingObject[0].GIS_LINK}'`;
        //       let query = CondosLayer.createQuery();
        //       query.where = whereClause;
        //       query.returnGeometry = true;
        //       query.returnHiddenFields = true; // Adjust based on your needs
        //       query.outFields = ["*"];

        //       CondosLayer.queryFeatures(query).then((response) => {
        //         let feature = response;
        //         let geometry = feature.features[0].geometry;

        //         // Get the extent of the geometry
        //         const geometryExtent = geometry.extent;

        //         // Calculate the center of the geometry
        //         const center = geometryExtent.center;

        //         // Calculate a new extent with a slightly zoomed-out level
        //         const zoomOutFactor = 3.0; // Adjust as needed
        //         const newExtent = geometryExtent.expand(zoomOutFactor);

        //         // Set the view to the new extent
        //         view.goTo({
        //           target: center, // Center the view on the center of the geometry
        //           extent: newExtent, // Set the extent to the new adjusted extent
        //         });
        //       });
        //       // You can perform any actions you want here, such as zooming to a location
        //     }
        //   });
        // });
      }

      function zoomToDetail(objectid, geom, item) {
        detailsChanged = {
          isChanged: true,
          item: item,
        };
        let bufferGraphicId = "uniqueBufferGraphicId";

        view.graphics.removeAll(polygonGraphics);

        const fillSymbol = {
          type: "simple-fill",
          color: [0, 0, 0, 0.1],
          outline: {
            color: [145, 199, 61, 1],
            width: 3,
          },
        };

        // if (sessionStorage.getItem(key) == "no") {
        // if (noCondosParcelGeom) {
        // CondoBuffer = false;
        targetExtent = geom;
        detailsGeometry = geom;

        const polygonGraphic = new Graphic({
          geometry: targetExtent,
          symbol: fillSymbol,
          id: bufferGraphicId,
        });

        view.graphics.addMany([polygonGraphic]);
        view.goTo({
          target: polygonGraphic,
          zoom: 15,
          // zoom: 15,
        });
      }

      function zoomToParcel(gisLink) {
        let whereClause = `GIS_LINK = '${gisLink}'`;
        let query = noCondosLayer.createQuery();
        query.where = whereClause;
        query.returnGeometry = true;
        query.returnHiddenFields = true; // Adjust based on your needs
        query.outFields = ["*"];

        noCondosLayer.queryFeatures(query).then((response) => {
          let feature = response;
          let geometry = feature.features[0].geometry;

          targetExtent = geometry;

          view.goTo({
            target: geometry,
            zoom: oldZoom,
          });
        });
      }

      function zoomToFeature(objectid, notPolygonGraphics, gisLink) {
        detailsChanged = {
          isChanged: false,
          item: "",
        };
        isGisLink = [];
        let bufferGraphicId = "uniqueBufferGraphicId";
        view.graphics.removeAll(polygonGraphics);

        const existingBufferGraphicIndex = view.graphics.items.findIndex(
          (g) => g.id === bufferGraphicId
        );

        if (existingBufferGraphicIndex > -1) {
          view.graphics.removeAt(existingBufferGraphicIndex);
        }

        isGisLink = firstList.filter((obj) => obj.GIS_LINK == gisLink);

        // if "no condos" and GIS_LINK is equal to firstlist(means its searched by GIS_LINK)
        // and GIS_LINK > 1( not searched on one uniqueid w/ no geometry) or will error
        if (
          sessionStorage.getItem("condos") == "no" &&
          isGisLink.length == firstList.length &&
          isGisLink.length > 1
        ) {
          if (noCondosParcelGeom) {
            CondoBuffer = false;
            targetExtent = noCondosParcelGeom[0].geometry;
            detailsGeometry = noCondosParcelGeom[0].geometry;
            const fillSymbol = {
              type: "simple-fill",
              color: [0, 0, 0, 0.1],
              outline: {
                color: [145, 199, 61, 1],
                width: 4,
              },
            };

            const polygonGraphic = new Graphic({
              geometry: targetExtent,
              symbol: fillSymbol,
              id: bufferGraphicId,
            });

            view.graphics.addMany([polygonGraphic]);
            view.goTo({
              target: polygonGraphic,
              zoom: 14,
            });
          } else {
            let whereClause = `GIS_LINK = '${gisLink}'`;
            let query = noCondosLayer.createQuery();
            query.where = whereClause;
            query.returnGeometry = true;
            query.returnHiddenFields = true; // Adjust based on your needs
            query.outFields = ["*"];

            noCondosLayer.queryFeatures(query).then((response) => {
              let feature = response;
              let geometry = feature.features[0].geometry;

              targetExtent = geometry;
              detailsGeometry = geometry;

              view.goTo({
                target: geometry,
                zoom: 14,
              });

              const fillSymbol = {
                type: "simple-fill",
                color: [0, 0, 0, 0.1],
                outline: {
                  color: [145, 199, 61, 1],
                  width: 4,
                },
              };

              const polygonGraphic = new Graphic({
                geometry: detailsGeometry,
                symbol: fillSymbol,
                id: bufferGraphicId,
              });
              view.graphics.addMany([polygonGraphic]);
            });
          }
        } else {
          CondoBuffer = true;
          let matchingObject = firstList.filter(
            (obj) => obj.objectid == objectid
          );

          if (matchingObject) {
            // matchingObject.forEach(function (feature) {
            // console.log(feature);
            if (
              matchingObject[0].geometry != null &&
              matchingObject[0].geometry != ""
            ) {
              detailsGeometry = matchingObject[0].geometry;

              view.goTo({
                target: detailsGeometry,
                zoom: 15,
              });

              const fillSymbol = {
                type: "simple-fill",
                color: [0, 0, 0, 0.1],
                outline: {
                  color: [145, 199, 61, 1],
                  width: 4,
                },
              };

              const polygonGraphic = new Graphic({
                geometry: detailsGeometry,
                symbol: fillSymbol,
                id: bufferGraphicId,
              });
              view.graphics.addMany([polygonGraphic]);
            } else {
              CondoBuffer = false;
              let whereClause = `GIS_LINK = '${matchingObject[0].GIS_LINK}'`;
              let query = noCondosLayer.createQuery();
              query.where = whereClause;
              query.returnGeometry = true;
              query.returnHiddenFields = true; // Adjust based on your needs
              query.outFields = ["*"];

              noCondosLayer.queryFeatures(query).then((response) => {
                let feature = response;
                let geometry = feature.features[0].geometry;

                detailsGeometry = geometry;

                view.goTo({
                  target: geometry,
                  zoom: 15,
                });

                const fillSymbol = {
                  type: "simple-fill",
                  color: [0, 0, 0, 0.1],
                  outline: {
                    color: [145, 199, 61, 1],
                    width: 4,
                  },
                };

                const polygonGraphic = new Graphic({
                  geometry: detailsGeometry,
                  symbol: fillSymbol,
                  id: bufferGraphicId,
                });
                view.graphics.addMany([polygonGraphic]);
              });
            }
            // });
          }
        }
        if (clickHandle) {
          clickHandle?.remove();
          clickHandle = null;
        }
        if (DetailsHandle) {
          DetailsHandle?.remove();
          DetailsHandle = null;
        }
        DetailsHandle = view.on("click", handleDetailsClick);
      }

      const buildAbuttersPanel = function (e, b) {
        $("#abutters-title").html("Abutters");

        let itemSelected = detailSelected;

        let locationMaillingAddress;
        let locationUniqueId;
        let locationGISLINK;
        let locationOwner;
        let locationCoOwner;
        let locationMailZip;
        let locationAddress;
        let locationAddress2;
        let locationMailCity;
        let locationMailState;
        let locationMBL;

        if (detailsChanged.isChanged) {
          locationMaillingAddress =
            detailsChanged.item.attributes.Mailing_Address_1;
          locationUniqueId = detailsChanged.item.attributes.Uniqueid;
          locationGISLINK = detailsChanged.item.attributes.GIS_LINK;
          locationOwner = detailsChanged.item.attributes.Owner;
          locationMBL = detailsChanged.item.attributes.MBL;
          locationCoOwner = detailsChanged.item.attributes.Co_Owner;
          locationAddress = detailsChanged.item.attributes.Mailing_Address_1;
          locationAddress2 = detailsChanged.item.attributes.Mailing_Address_2;
          locationMailCity = detailsChanged.item.attributes.Mailing_City;
          locationMailZip = detailsChanged.item.attributes.Mailing_Zip;
          locationMailState = detailsChanged.item.attributes.Mail_State;
        } else {
          var matchedObject = firstList.find(function (item) {
            return (
              (item.uniqueId === itemSelected[1] &&
                item.objectid === Number(itemSelected[0])) ||
              (item.GIS_LINK === itemSelected[1] &&
                item.objectid === Number(itemSelected[0]))
            );
          });

          locationMaillingAddress =
            matchedObject.mailingAddress === undefined
              ? ""
              : matchedObject.mailingAddress;

          locationUniqueId =
            matchedObject.uniqueId === undefined ? "" : matchedObject.uniqueId;

          locationGISLINK =
            matchedObject.GIS_LINK === undefined ? "" : matchedObject.GIS_LINK;

          locationOwner =
            matchedObject.owner === undefined ? "" : matchedObject.owner;

          locationCoOwner =
            matchedObject.coOwner === undefined ? "" : matchedObject.coOwner;

          locationAddress =
            matchedObject.mailingAddress === undefined
              ? ""
              : matchedObject.mailingAddress;

          locationAddress2 =
            matchedObject.mailingAddress2 === undefined
              ? ""
              : matchedObject.mailingAddress2;

          locationMailCity =
            matchedObject.Mailing_City === undefined
              ? ""
              : matchedObject.Mailing_City;

          locationMailState =
            matchedObject.Mail_State === undefined
              ? ""
              : matchedObject.Mail_State;

          locationMailZip =
            matchedObject.Mailing_Zip === undefined
              ? ""
              : matchedObject.Mailing_Zip;

          locationMBL =
            matchedObject.MBL === undefined ? "" : matchedObject.MBL;
        }

        const abuttersDiv = document.getElementById("selected-feature");
        // console.log("After selecting: ", featureWidDiv);

        const listGroup = document.createElement("ul");
        listGroup.classList.add("row");
        listGroup.classList.add("list-group");

        const listItem = document.createElement("li");
        listItem.classList.add("abutters-group-item", "col-12");

        let listItemHTML;

        listItemHTML = ` ${locationOwner} ${locationCoOwner} <br> ${locationAddress} ${locationAddress2} <br> ${locationMailCity}, ${locationMailState} ${locationMailZip}`;
        listItem.innerHTML += listItemHTML;

        listItem.setAttribute("data-id", locationGISLINK);
        $("#abutters-spinner").hide();
        listGroup.appendChild(listItem);
        abuttersDiv.appendChild(listGroup);
      };

      // LOGIC FOR SEARCH OF FEATURE LAYERS AND RELATED RECORDS

      const runQuery = (e) => {
        firstList = [];

        // Check if the key exists in sessionStorage
        // if (sessionStorage.getItem(key) === "no") {
        //   noCondosLayer.visible = true;
        // } else {
        //   CondosLayer.visible = true;
        // }

        // noCondosLayer.visible = true;
        // CondosLayer.visible = true;
        let suggestionsContainer = document.getElementById("suggestions");
        suggestionsContainer.innerHTML = "";

        let features;

        if (clickedToggle) {
          runQuerySearchTerm = e;
        }

        let searchTerm = runQuerySearchTerm;

        if (searchTerm.length < 3 || !searchTerm) {
          clearContents();
          return;
        } else {
          $("#dropdown").toggleClass("expanded");
          $("#details-btns").hide();
          $("#abut-mail").hide();
          $("#result-btns").hide();
          $("#backButton").hide();
          $("#detailsButton").hide();
          $("#featureWid").empty();
          $("#exportSearch").hide();
          $("#csvExportResults").hide();
          $("#exportButtons").hide();

          let whereClause = `
              Street_Name LIKE '%${searchTerm}%' OR 
              MBL LIKE '%${searchTerm}%' OR 
              Location LIKE '%${searchTerm}%' OR 
              Co_Owner LIKE '%${searchTerm}%' OR 
              Uniqueid LIKE '%${searchTerm}%' OR 
              Owner LIKE '%${searchTerm}%' OR
              GIS_LINK LIKE '%${searchTerm}%'
          `;

          let query = noCondosTable.createQuery();
          query.where = whereClause;
          query.returnGeometry = false;
          query.returnHiddenFields = true; // Adjust based on your needs
          query.outFields = ["*"];

          noCondosTable
            .queryFeatures(query)
            .then((response) => {
              if (response.features.length > 0) {
                features = response.features;
                features.forEach(function (feature) {
                  if (feature.attributes.Owner === "" || null || undefined) {
                    return;
                  } else {
                    let objectId = feature.attributes["OBJECTID"];
                    let locationVal = feature.attributes.Location;
                    let locationUniqueId = feature.attributes["Uniqueid"];
                    let locationGISLINK = feature.attributes["GIS_LINK"];
                    let locationCoOwner = feature.attributes["Co_Owner"];
                    let locationOwner = feature.attributes["Owner"];
                    let locationMBL = feature.attributes["MBL"];
                    let locationGeom = feature.geometry;
                    let mailingAddress =
                      feature.attributes["Mailing_Address_1"];
                    let mailingAddress2 =
                      feature.attributes["Mailing_Address_2"];
                    let Mailing_City = feature.attributes["Mailing_City"];
                    let Mail_State = feature.attributes["Mail_State"];
                    let Mailing_Zip = feature.attributes["Mailing_Zip"];
                    let Total_Acres = feature.attributes["Total_Acres"];
                    let Parcel_Primary_Use =
                      feature.attributes["Parcel_Primary_Use"];
                    let Building_Use_Code =
                      feature.attributes["Building_Use_Code"];
                    let Parcel_Type = feature.attributes["Parcel_Type"];
                    let Design_Type = feature.attributes["Design_Type"];
                    let Zoning = feature.attributes["Zoning"];
                    let Neighborhood = feature.attributes["Neighborhood"];
                    let Land_Type_Rate = feature.attributes["Land_Type_Rate"];
                    let Functional_Obs = feature.attributes["Functional_Obs"];
                    let External_Obs = feature.attributes["External_Obs"];
                    let orig_date = feature.attributes["Sale_Date"];
                    let Sale_Date = formatDate(orig_date);
                    let Sale_Price = feature.attributes["Sale_Price"];
                    let Vol_Page = feature.attributes["Vol_Page"];
                    let Assessed_Total = feature.attributes["Assessed_Total"];
                    let Appraised_Total = feature.attributes["Appraised_Total"];
                    let Influence_Factor =
                      feature.attributes["Influence_Factor"];
                    let Influence_Type = feature.attributes["Influence_Type"];
                    let Land_Type = feature.attributes["Land_Type"];
                    let Prior_Assessment_Year =
                      feature.attributes["Prior_Assessment_Year"];
                    let Prior_Assessed_Total =
                      feature.attributes["Prior_Assessed_Total"];
                    let Prior_Appraised_Total =
                      feature.attributes["Prior_Appraised_Total"];
                    let Map = feature.attributes["Map"];
                    let Lat = feature.attributes["Lat"];
                    let Lon = feature.attributes["Lon"];

                    firstList.push(
                      new Parcel(
                        objectId,
                        locationVal,
                        locationUniqueId,
                        locationGISLINK,
                        locationCoOwner,
                        locationOwner,
                        locationMBL,
                        locationGeom,
                        mailingAddress,
                        mailingAddress2,
                        Mailing_City,
                        Mail_State,
                        Mailing_Zip,
                        Total_Acres,
                        Parcel_Primary_Use,
                        Building_Use_Code,
                        Parcel_Type,
                        Design_Type,
                        Zoning,
                        Neighborhood,
                        Land_Type_Rate,
                        Functional_Obs,
                        External_Obs,
                        Sale_Date,
                        Sale_Price,
                        Vol_Page,
                        Assessed_Total,
                        Appraised_Total,
                        Influence_Factor,
                        Influence_Type,
                        Land_Type,
                        Prior_Assessment_Year,
                        Prior_Assessed_Total,
                        Prior_Appraised_Total,
                        Map,
                        Lat,
                        Lon
                      )
                    );
                  }
                });
                queryRelatedRecords(runQuerySearchTerm);
              }
            })
            .catch((error) => {
              console.error("Error querying for details:", error);
            });
        }
      };

      function triggerListGroup(results, searchTerm) {
        let items = results;

        if (items.length <= 0) {
          clearContents();
          alert("Search resulted in an error, please try again.");
        }

        let parcel = items.filter(
          (item) => item.attributes.Uniqueid === searchTerm
        );

        let itemId = parcel[0].attributes.Uniqueid;
        let objectID = parcel[0].attributes.OBJECTID;
        let geometry = parcel[0].attributes.geometry;

        zoomToFeature(objectID, polygonGraphics, itemId);
        $("#details-spinner").show();
        $("#WelcomeBox").hide();
        $("#featureWid").hide();
        $("#result-btns").hide();
        $("#abutters-content").hide();
        $("#details-btns").show();
        $("#abut-mail").show();
        $("#detailBox").show();
        $("#backButton").show();
        $("#detailsButton").hide();
        $("#detail-content").empty();
        $("#selected-feature").empty();
        $("#exportButtons").hide();
        $("#exportSearch").hide();
        $("#exportResults").hide();
        $("#csvExportResults").hide();
        $("#csvExportSearch").hide();
        $(".center-container").hide();
        $("#results-div").css("height", "300px");
        $("#backButton-div").css("padding-top", "0px");
        document.getElementById("total-results").style.display = "none";
        buildDetailsPanel(objectID, itemId);
        $("#total-results").hide();
        $("#ResultDiv").hide();

        // view.goTo({
        //   target: results,
        // });
      }

      // Helper function to parse and modify URL query parameters
      function removeQueryParam(key, sourceURL) {
        let rtn = sourceURL.split("?")[0],
          param,
          params_arr = [],
          queryString =
            sourceURL.indexOf("?") !== -1 ? sourceURL.split("?")[1] : "";
        if (queryString !== "") {
          params_arr = queryString.split("&");
          for (let i = params_arr.length - 1; i >= 0; i -= 1) {
            param = params_arr[i].split("=")[0];
            if (param === key) {
              params_arr.splice(i, 1);
            }
          }
          rtn = rtn + "?" + params_arr.join("&");
        }
        return rtn;
      }

      // Helper function to parse URL query parameters
      function getQueryParams() {
        const queryParams = {};
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split("&");

        for (let i = 0; i < pairs.length; i++) {
          const pair = pairs[i].split("=");
          if (pair[0] && pair[1]) {
            // Ensure the key and value exist
            queryParams[decodeURIComponent(pair[0])] = decodeURIComponent(
              pair[1].replace(/\+/g, " ")
            );
          }
        }
        return queryParams;
      }

      // document.addEventListener("DOMContentLoaded", async () => {
      const params = getQueryParams();
      const uniqueId = params.uniqueid; // Ensure this key matches your URL parameter

      if (uniqueId) {
        // Assuming the layer name and field name are known and static
        const layerName = "Parcel Boundaries";
        const fieldName = "UniqueId";
        urlSearchUniqueId = true;
        let urlSearch = true;

        view
          .when(function () {
            // This function runs when the view is fully ready
            console.log("The view is ready.");

            // Place your function call or code here
            queryRelatedRecords(uniqueId, urlSearch);
          })
          .catch(function (error) {
            console.error("Error occurred while the view was loading: ", error);
          });
      }
      // });

      // document
      //   .getElementById("searchInput")
      //   .addEventListener("change", function (e) {
      //     var searchTerm = e.target.value.toUpperCase();

      //     if (searchTerm.length === 0) {
      //       alert("you are a fool");
      //     }
      //   });

      document
        .getElementById("searchInput")
        .addEventListener("input", function (e) {
          firstList = [];
          $("#sidebar2").css("left", "-350px");
          $("#sidebar2").removeClass("collapsed");
          $("#results-div").css("left", "0px");
          $("#dropdown").toggleClass("expanded");
          $("#dropdown").hide();
          $("#result-btns").hide();
          $("#details-btns").hide();
          $("#abut-mail").hide();

          var searchTerm = e.target.value.toUpperCase();

          // if (searchTerm.length < 1) {
          //   if (DetailsHandle) {
          //     DetailsHandle?.remove();
          //     DetailsHandle = null;
          //   }

          //   if (clickHandle) {
          //     clickHandle?.remove();
          //     clickHandle = null;
          //   }

          //   clickHandle = view.on("click", handleClick);
          //   $("#lasso").removeClass("btn-warning");
          //   $("#select-button").addClass("btn-warning");
          //   select = true;
          //   lasso = false;
          // }

          // if (searchTerm.length < 2) {
          firstList = [];
          secondList = [];
          polygonGraphics = [];
          $("#select-button").removeClass("btn-warning");
          $("#searchInput ul").remove();
          $("#suggestions").hide();
          $("#featureWid").empty();
          $("#featureWid").hide();
          $("#ResultDiv").hide();
          $("#dropdown").removeClass("expanded");
          $("#dropdown").hide();
          $("#result-btns").hide();
          $("#details-btns").hide();
          $("#abut-mail").hide();
          $("#right-arrow-2").show();
          $("#left-arrow-2").hide();
          $("#abutters-content").hide();
          $("#abutters-content").hide();
          $("#selected-feature").empty();
          $("#parcel-feature").empty();
          $("#backButton").hide();
          $("#detailBox").hide();
          $("#exportSearch").hide();
          $("#csvExportSearch").hide();
          $("#csvExportResults").hide();
          $("#exportButtons").hide();
          if (DetailsHandle) {
            DetailsHandle?.remove();
            DetailsHandle = null;
          }

          if (clickHandle) {
            clickHandle?.remove();
            clickHandle = null;
          }

          $("#dropdown").show();
          $("#WelcomeBox").show();
          // $("#select-button").attr("title", "Add to Selection Enabled");
          $(".center-container").show();

          // clickHandle = view.on("click", handleClick);
          // $("#lasso").removeClass("btn-warning");
          // $("#select-button").addClass("btn-warning");
          // select = true;
          // lasso = false;

          let suggestionsContainer = document.getElementById("suggestions");
          suggestionsContainer.innerHTML = "";
          $("#featureWid").empty();
          view.graphics.removeAll();

          // Construct your where clause
          let whereClause = `
            Street_Name LIKE '%${searchTerm}%' OR 
            MBL LIKE '%${searchTerm}%' OR 
            Location LIKE '%${searchTerm}%' OR 
            Co_Owner LIKE '%${searchTerm}%' OR 
            Uniqueid LIKE '%${searchTerm}%' OR 
            Owner LIKE '%${searchTerm}%' OR
            GIS_LINK LIKE '%${searchTerm}%'
        `;

          let query = noCondosTable.createQuery();
          query.where = whereClause;
          query.returnGeometry = false;
          query.outFields = [
            "Street_Name",
            "MBL",
            "Location",
            "Co_Owner",
            "Uniqueid",
            "Owner",
            "GIS_LINK",
          ];

          let uniqueSuggestions = new Set();

          noCondosTable.queryFeatures(query).then((response) => {
            let suggestionsContainer = document.getElementById("suggestions");
            suggestionsContainer.innerHTML = ""; // Clear previous suggestions

            response.features.forEach((feature) => {
              [
                "Street_Name",
                "MBL",
                "Location",
                "Co_Owner",
                "Uniqueid",
                "Owner",
                "GIS_LINK",
              ].forEach((fieldName) => {
                // console.log("Processing field:", fieldName);
                let value = feature.attributes[fieldName];
                if (
                  value &&
                  value.includes(searchTerm) &&
                  !uniqueSuggestions.has(value)
                ) {
                  let suggestionDiv = document.createElement("div");
                  suggestionDiv.className = "list-group-item";
                  suggestionDiv.innerText = `${value}`;

                  suggestionsContainer.appendChild(suggestionDiv);

                  // Add the value to the Set
                  uniqueSuggestions.add(value);
                  suggestionsContainer.style.display = "block";

                  suggestionDiv.addEventListener("click", function (e) {
                    clickedToggle = true;
                    runQuery(e.target.innerHTML);
                    clickedToggle = false;
                  });
                }
              });
            });
          });
        });

      // Attach event listener to the search input
      document
        .querySelector(".form-inline")
        .addEventListener("submit", function (e) {
          // Check if the key exists in sessionStorage
          if (sessionStorage.getItem("condos") === "no") {
            noCondosLayer.visible = true;
          } else {
            CondosLayer.visible = true;
          }
          firstList = [];
          view.graphics.removeAll();
          polygonGraphics = [];

          e.preventDefault();
          $("#featureWid").empty();
          $("#selected-feature").empty();
          // $("#exportSearch").show();
          if (DetailsHandle) {
            DetailsHandle?.remove();
            DetailsHandle = null;
          }
          if (clickHandle) {
            clickHandle?.remove();
            clickHandle = null;
          }
        });

      // Hide suggestions when clicking outside
      document.addEventListener("click", function (e) {
        if (e.target.id !== "searchInput") {
          document.getElementById("suggestions").style.display = "none";
        }
      });

      let debounceTimer2;

      function hitQuery() {
        if (sessionStorage.getItem("condos") === "no") {
          noCondosLayer.visible = true;
        } else {
          CondosLayer.visible = true;
        }

        $("#lasso").removeClass("btn-warning");
        $("#select-button").removeClass("btn-warning");
        $("dropdown").empty();
        $("#featureWid").empty();
        $("#abutters-content").hide();
        $("#selected-feature").empty();
        $("#parcel-feature").empty();
        $("#total-results").show();
        $("#ResultDiv").hide();
        $("#backButton").hide();
        $("#detailsButton").hide();
        $("#detailBox").hide();
        $("#result-btns").hide();
        $("#details-btns").hide();
        $("#abut-mail").hide();
        $("#abutters-title").html(`Abutting Parcels (0)`);
        polygonGraphics = [];
        view.graphics.removeAll();
        if (DetailsHandle) {
          DetailsHandle?.remove();
          DetailsHandle = null;
        }
        if (clickHandle) {
          clickHandle?.remove();
          clickHandle = null;
        }
        runQuery();
      }

      document
        .getElementById("searchButton")
        .addEventListener("click", function () {
          $("#sidebar2").css("left", "-350px");
          $("#sidebar2").removeClass("collapsed");
          $("#results-div").css("left", "0px");
          $("#exportResults").hide();
          $("#csvExportResults").hide();
          function throttleQuery() {
            clearTimeout(debounceTimer2);
            debounceTimer2 = setTimeout(() => {
              hitQuery();
            }, 300);
          }
          throttleQuery();
        });

      $(document).ready(function () {
        let queryParameters = {
          streetName: null,
          owner: null,
          appraisedValueMin: null,
          appraisedValueMax: null,
          assessedValueMin: null,
          assessedValueMax: null,
          zoningType: null,
          neighborhoodType: null,
          propertyType: null,
          buildingType: null,
          buildingUseType: null,
          designType: null,
          acresValueMin: null,
          acresValueMax: null,
          soldOnMin: null,
          soldOnMax: null,
          soldPMin: null,
          soldPMax: null,
        };

        function updateQuery() {
          console.log(queryParameters);
          let queryParts = [];
          if (
            queryParameters.streetName !== null &&
            queryParameters.streetName.length > 1
          ) {
            if (Array.isArray(queryParameters.streetName)) {
              // Map each name in the array to a LIKE query part with % wildcards
              const streetNameParts = queryParameters.streetName.map(
                (name) => `Street_Name LIKE '%${name.trim()}%'`
              );
              // Join these parts with OR
              queryParts.push(`(${streetNameParts.join(" OR ")})`);
            } else {
              queryParts.push(
                `(Street_Name LIKE '%${queryParameters.streetName.trim()}%')`
              );
            }
          }
          if (
            queryParameters.owner !== null &&
            queryParameters.owner.length > 1
          ) {
            if (Array.isArray(queryParameters.owner)) {
              // Map each name in the array to a LIKE query part with % wildcards
              const ownerParts = queryParameters.owner.map(
                (name) => `Owner LIKE '%${name.trim()}%'`
              );
              // Join these parts with OR
              queryParts.push(`(${ownerParts.join(" OR ")})`);
            } else {
              queryParts.push(
                `(Owner LIKE '%${queryParameters.owner.trim()}%')`
              );
            }
          }

          if (
            queryParameters.appraisedValueMin !== null &&
            queryParameters.appraisedValueMax !== null
          ) {
            queryParts.push(
              `Appraised_Total BETWEEN ${queryParameters.appraisedValueMin} AND ${queryParameters.appraisedValueMax}`
            );
          }

          if (
            queryParameters.assessedValueMin !== null &&
            queryParameters.assessedValueMax !== null
          ) {
            queryParts.push(
              `Assessed_Total BETWEEN ${queryParameters.assessedValueMin} AND ${queryParameters.assessedValueMax}`
            );
          }
          if (
            queryParameters.propertyType !== null &&
            queryParameters.propertyType.length > 1
          ) {
            if (Array.isArray(queryParameters.propertyType)) {
              // Map each name in the array to a LIKE query part with % wildcards
              const PropertyParts = queryParameters.propertyType.map(
                (name) => `Parcel_Type LIKE '%${name.trim()}%'`
              );
              // Join these parts with OR
              queryParts.push(`(${PropertyParts.join(" OR ")})`);
            } else {
              queryParts.push(
                `(Parcel_Type LIKE '%${queryParameters.propertyType.trim()}%')`
              );
            }
          }

          if (
            queryParameters.zoningType !== null &&
            queryParameters.zoningType.length > 1
          ) {
            if (Array.isArray(queryParameters.zoningType)) {
              // Map each name in the array to a LIKE query part with % wildcards
              const PropertyParts = queryParameters.zoningType.map(
                (name) => `Zoning LIKE '%${name.trim()}%'`
              );
              // Join these parts with OR
              queryParts.push(`(${PropertyParts.join(" OR ")})`);
            } else {
              queryParts.push(
                `(Zoning LIKE '%${queryParameters.zoningType.trim()}%')`
              );
            }
          }

          if (
            queryParameters.neighborhoodType !== null &&
            queryParameters.neighborhoodType.length > 1
          ) {
            if (Array.isArray(queryParameters.neighborhoodType)) {
              // Map each name in the array to a LIKE query part with % wildcards
              const PropertyParts = queryParameters.neighborhoodType.map(
                (name) => `Neighborhood LIKE '%${name.trim()}%'`
              );
              // Join these parts with OR
              queryParts.push(`(${PropertyParts.join(" OR ")})`);
            } else {
              queryParts.push(
                `(Neighborhood LIKE '%${queryParameters.neighborhoodType.trim()}%')`
              );
            }
          }

          if (
            queryParameters.buildingType !== null &&
            queryParameters.buildingType.length > 1
          ) {
            if (Array.isArray(queryParameters.buildingType)) {
              // Map each name in the array to a LIKE query part with % wildcards
              const BuildingParts = queryParameters.buildingType.map(
                (name) => `Building_Type LIKE '%${name.trim()}%'`
              );
              // Join these parts with OR
              queryParts.push(`(${BuildingParts.join(" OR ")})`);
            } else {
              queryParts.push(
                `(Building_Type LIKE '%${queryParameters.buildingType.trim()}%')`
              );
            }
          }

          if (
            queryParameters.buildingUseType !== null &&
            queryParameters.buildingUseType.length > 1
          ) {
            if (Array.isArray(queryParameters.buildingUseType)) {
              // Map each name in the array to a LIKE query part with % wildcards
              const BuildingUseParts = queryParameters.buildingUseType.map(
                (name) => `Building_Use_Type LIKE '%${name.trim()}%'`
              );
              // Join these parts with OR
              queryParts.push(`(${BuildingUseParts.join(" OR ")})`);
            } else {
              queryParts.push(
                `(Building_Use_Type LIKE '%${queryParameters.buildingUseType.trim()}%')`
              );
            }
          }

          if (
            queryParameters.designType !== null &&
            queryParameters.designType.length > 1
          ) {
            if (Array.isArray(queryParameters.designType)) {
              // Map each name in the array to a LIKE query part with % wildcards
              const DesignParts = queryParameters.designType.map(
                (name) => `Design_Type LIKE '%${name.trim()}%'`
              );
              // Join these parts with OR
              queryParts.push(`(${DesignParts.join(" OR ")})`);
            } else {
              queryParts.push(
                `(Design_Type LIKE '%${queryParameters.designType.trim()}%')`
              );
            }
          }

          if (
            queryParameters.acresValueMin !== null &&
            queryParameters.acresValueMax !== null
          ) {
            queryParts.push(
              `Total_Acres BETWEEN ${queryParameters.acresValueMin} AND ${queryParameters.acresValueMax}`
            );
          }

          if (
            queryParameters.soldOnMin !== null &&
            queryParameters.soldOnMax !== null
          ) {
            // var minDate = new Date(queryParameters.soldOnMin);
            // var maxDate = new Date(queryParameters.soldOnMax);

            queryParts.push(
              `Sale_Date >= '${queryParameters.soldOnMin}' AND Sale_Date <= '${queryParameters.soldOnMax}'`
            );
          }

          if (
            queryParameters.soldPMin !== null &&
            queryParameters.soldPMax !== null
          ) {
            queryParts.push(
              `Sale_Price BETWEEN ${queryParameters.soldPMin} AND ${queryParameters.soldPMax}`
            );
          }

          let queryString = queryParts.join(" AND ");

          if (sessionStorage.getItem("condos") === "no") {
            let query = noCondosLayer.createQuery();
            query.where = queryString;
            query.returnDistinctValues = false;
            query.returnGeometry = true;
            query.outFields = ["*"];

            noCondosLayer.queryFeatures(query).then(function (response) {
              clearContents();
              addPolygons(response, view.graphics);
              processFeatures(response.features);
              if (clickHandle) {
                clickHandle?.remove();
                clickHandle = null;
              }
              if (DetailsHandle) {
                DetailsHandle?.remove();
                DetailsHandle = null;
              }
              DetailsHandle = view.on("click", handleDetailsClick);
            });
          } else {
            let query = CondosLayer.createQuery();
            query.where = queryString;
            query.returnDistinctValues = false;
            query.returnGeometry = true;
            query.outFields = ["*"];

            CondosLayer.queryFeatures(query).then(function (response) {
              clearContents();
              addPolygons(response, view.graphics);
              processFeatures(response.features);
              if (clickHandle) {
                clickHandle?.remove();
                clickHandle = null;
              }
              if (DetailsHandle) {
                DetailsHandle?.remove();
                DetailsHandle = null;
              }
              DetailsHandle = view.on("click", handleDetailsClick);
            });
          }

          // Here, you can use this query string to fetch data from your feature service
        }

        $("#streetFilter").on("calciteComboboxChange", function (e) {
          // value = e.target.value;
          queryParameters.streetName = e.target.value;
          let itemsList = $("#streetFilter");
          let selectedItems = itemsList[0].selectedItems;
          // selectedItems.forEach((item) => {
          //   console.log(item.value); // Assuming each item has a value attribute
          // });

          // console.log(`street filter is: ${value}`);
        });

        $("#ownerFilter").on("calciteComboboxChange", function (e) {
          queryParameters.owner = e.target.value;
        });

        // $("#app-val-slider").on("calciteSliderChange", function (e) {
        //   value = e.target.value;
        //   minVal = value[0];
        //   maxVal = value[1];

        //   queryParameters.appraisedValueMin = minVal;
        //   $("#app-val-min").val("$" + minVal.toLocaleString());
        //   queryParameters.appraisedValueMax = maxVal;
        //   $("#app-val-max").val("$" + maxVal.toLocaleString());
        // });
        $("#app-val-min, #app-val-max").on("input", function () {
          // Get the input values as strings
          var minValStr = $("#app-val-min").val();
          var maxValStr = $("#app-val-max").val();

          // Remove the dollar sign and any commas
          minValStr = minValStr.replace(/^\$/, "").replace(/,/g, "");
          maxValStr = maxValStr.replace(/^\$/, "").replace(/,/g, "");

          // Parse the values as integers
          var minVal = parseInt(minValStr, 10);
          var maxVal = parseInt(maxValStr, 10);

          // Check if the parsed values are valid numbers
          if (!isNaN(minVal) && !isNaN(maxVal)) {
            // Format the parsed values with commas for display
            var formattedMinVal = minVal.toLocaleString();
            var formattedMaxVal = maxVal.toLocaleString();

            // Update the input fields with the formatted values and dollar signs
            $("#app-val-min").val("$" + formattedMinVal);
            $("#app-val-max").val("$" + formattedMaxVal);

            // Update queryParameters with the numerical values
            queryParameters.appraisedValueMin = minVal;
            queryParameters.appraisedValueMax = maxVal;

            // Optionally, update the slider values with the parsed integers
            // const slider1 = document.querySelector("#app-val-slider");
            // slider1.value = [minVal, maxVal];
          }
        });

        // $("#assess-val-slider").on("calciteSliderChange", function (e) {
        //   value = e.target.value;
        //   minVal = value[0];
        //   maxVal = value[1];

        //   queryParameters.assessedValueMin = minVal;
        //   $("#assess-val-min").val("$" + minVal.toLocaleString());
        //   queryParameters.assessedValueMax = maxVal;
        //   $("#assess-val-max").val("$" + maxVal.toLocaleString());
        // });

        $("#assess-val-min, #assess-val-max").on("input", function () {
          var minValStr = $("#assess-val-min").val();
          var maxValStr = $("#assess-val-max").val();

          // Remove the dollar sign and any commas
          minValStr = minValStr.replace(/^\$/, "").replace(/,/g, "");
          maxValStr = maxValStr.replace(/^\$/, "").replace(/,/g, "");

          // Parse the values as integers
          var minVal = parseInt(minValStr, 10);
          var maxVal = parseInt(maxValStr, 10);

          // Check if the parsed values are valid numbers
          if (!isNaN(minVal) && !isNaN(maxVal)) {
            // Format the parsed values with commas for display
            var formattedMinVal = minVal.toLocaleString();
            var formattedMaxVal = maxVal.toLocaleString();

            // Update the input fields with the formatted values and dollar signs
            $("#assess-val-min").val("$" + formattedMinVal);
            $("#assess-val-max").val("$" + formattedMaxVal);

            queryParameters.assessedValueMin = minVal;
            queryParameters.assessedValueMax = maxVal;

            // Optionally, update the slider values with the parsed integers
            // const slider2 = document.querySelector("#assess-val-slider");
            // slider2.value = [minVal, maxVal];
          } else {
            // If the values are not valid numbers, handle accordingly (e.g., set to NaN)
            console.log("Invalid input");
          }
        });

        $("#propertyFilter").on("calciteComboboxChange", function (e) {
          queryParameters.propertyType = e.target.value;
        });

        $("#zoningFilter").on("calciteComboboxChange", function (e) {
          queryParameters.zoningType = e.target.value;
        });

        $("#neighborhoodFilter").on("calciteComboboxChange", function (e) {
          queryParameters.neighborhoodType = e.target.value;
        });

        $("#buildingFilter").on("calciteComboboxChange", function (e) {
          queryParameters.buildingType = e.target.value;
        });

        $("#buildingUseFilter").on("calciteComboboxChange", function (e) {
          queryParameters.buildingUseType = e.target.value;
        });

        $("#designTypeFilter").on("calciteComboboxChange", function (e) {
          queryParameters.designType = e.target.value;
        });

        // $("#acres-val-slider").on("calciteSliderChange", function (e) {
        //   value = e.target.value;
        //   minVal = value[0];
        //   maxVal = value[1];

        //   queryParameters.acresValueMin = minVal;
        //   $("#acres-val-min").val(minVal);
        //   queryParameters.acresValueMax = maxVal;
        //   $("#acres-val-max").val(maxVal);
        // });

        $("#acres-val-min, #acres-val-max").on("input", function () {
          var minVal = parseInt($("#acres-val-min").val());
          var maxVal = parseInt($("#acres-val-max").val());

          queryParameters.acresValueMin = minVal;
          queryParameters.acresValueMax = maxVal;

          // const slider3 = document.querySelector("#acres-val-slider");
          // slider3.value = [minVal, maxVal];
        });

        $("#sold_calendar_lowest").on("calciteDatePickerChange", function () {
          var dateValue = $("#sold_calendar_lowest").val();
          queryParameters.soldOnMin = dateValue;
        });

        $("#sold_calendar_highest").on("calciteDatePickerChange", function () {
          var dateValue = $("#sold_calendar_highest").val();
          queryParameters.soldOnMax = dateValue;
        });

        // $("#soldon-val-slider").on("calciteSliderChange", function (e) {
        //   value = e.target.value;
        //   minVal = value[0];
        //   maxVal = value[1];

        //   queryParameters.soldOnMin = minVal;
        //   $("#sold-val-min").val(minVal);

        //   queryParameters.soldOnMax = maxVal;
        //   $("#sold-val-max").val(maxVal);
        // });

        // $("#sold-val-min, #sold-val-max").on("input", function () {
        //   var minVal = parseInt($("#sold-val-min").val());
        //   var maxVal = parseInt($("#sold-val-max").val());

        //   const slider4 = document.querySelector("#soldon-val-slider");
        //   slider4.value = [minVal, maxVal];
        // });

        // $("#saleP-val-slider").on("calciteSliderChange", function (e) {
        //   value = e.target.value;
        //   minVal = value[0];
        //   maxVal = value[1];

        //   queryParameters.soldPMin = minVal;
        //   $("#saleP-val-min").val("$" + minVal.toLocaleString());

        //   queryParameters.soldPMax = maxVal;
        //   $("#saleP-val-max").val("$" + maxVal.toLocaleString());
        // });

        $("#saleP-val-min, #saleP-val-max").on("input", function () {
          var minValStr = $("#saleP-val-min").val();
          var maxValStr = $("#saleP-val-max").val();

          // Remove the dollar sign and any commas
          minValStr = minValStr.replace(/^\$/, "").replace(/,/g, "");
          maxValStr = maxValStr.replace(/^\$/, "").replace(/,/g, "");

          // Parse the values as integers
          var minVal = parseInt(minValStr, 10);
          var maxVal = parseInt(maxValStr, 10);

          // Check if the parsed values are valid numbers
          if (!isNaN(minVal) && !isNaN(maxVal)) {
            // Format the parsed values with commas for display
            var formattedMinVal = minVal.toLocaleString();
            var formattedMaxVal = maxVal.toLocaleString();

            // Update the input fields with the formatted values and dollar signs
            $("#saleP-val-min").val("$" + formattedMinVal);
            $("#saleP-val-max").val("$" + formattedMaxVal);

            queryParameters.soldPMin = minVal;
            queryParameters.soldPMax = maxVal;

            // Optionally, update the slider values with the parsed integers
            // const slider2 = document.querySelector("#saleP-val-slider");
            // slider2.value = [minVal, maxVal];
          } else {
            // If the values are not valid numbers, handle accordingly (e.g., set to NaN)
            console.log("Invalid input");
          }
        });

        function changeSliderValues(vals) {
          const sliderVals = [
            {
              fieldName: "Appraised_Total",
              // slider: "app-val-slider",
              minInput: "app-val-min",
              maxInput: "app-val-max",
              index: 0,
            },
            {
              fieldName: "Assessed_Total",
              // slider: "assess-val-slider",
              minInput: "assess-val-min",
              maxInput: "assess-val-max",
              index: 1,
            },

            {
              fieldName: "Total_Acres",
              // slider: "acres-val-slider",
              minInput: "acres-val-min",
              maxInput: "acres-val-max",
              index: 2,
            },
            {
              fieldName: "Sale_Date",
              minInput: "sold_calendar_lowest",
              maxInput: "sold_calendar_highest",
              index: 3,
            },
            {
              fieldName: "Sale_Price",
              // slider: "saleP-val-slider",
              minInput: "saleP-val-min",
              maxInput: "saleP-val-max",
              index: 4,
            },
          ];

          sliderVals.forEach(function (slider) {
            if (slider.fieldName == "Sale_Date") {
              // const sliderElLow = document.getElementById(slider.minInput);
              // const sliderElMax = document.getElementById(slider.maxInput);

              var minstr = vals[slider.index][slider.fieldName].min;
              var maxstr = vals[slider.index][slider.fieldName].max;

              // Create a Date object
              let dateL = new Date(minstr);
              let dateM = new Date(maxstr);

              // Extract the components
              let yearL = dateL.getFullYear();
              let monthL = ("0" + (dateL.getMonth() + 1)).slice(-2); // Months are zero-indexed
              let dayL = ("0" + dateL.getDate()).slice(-2);

              let yearM = dateM.getFullYear();
              let monthM = ("0" + (dateM.getMonth() + 1)).slice(-2); // Months are zero-indexed
              let dayM = ("0" + dateM.getDate()).slice(-2);

              // Format the date as yyyy-MM-dd
              let formattedDateL = `${yearL}-${monthL}-${dayL}`;
              // Format the date as yyyy-MM-dd
              let formattedDateM = `${yearM}-${monthM}-${dayM}`;

              // sliderElLow.value = formattedDateL;
              // sliderElMax.value = formattedDateM;

              queryParameters.soldOnMin = formattedDateL;
              queryParameters.soldOnMax = formattedDateM;

              // const sliderInputMin = document.getElementById(slider.minInput);
              // const sliderInputMax = document.getElementById(slider.maxInput);
            } else {
              // gets slider and slider min / max values
              // const sliderEl = document.getElementById(slider.slider);
              const sliderInputMin = document.getElementById(slider.minInput);
              const sliderInputMax = document.getElementById(slider.maxInput);

              // let minString = vals[slider.index][slider.fieldName].min;
              // let maxString = vals[slider.index][slider.fieldName].max;

              //   var formattedMinValue = minStr.minValue.toLocaleString();
              //   var formattedMaxValue =maxStr.maxValue.toLocaleString();

              // sliderEl.min = vals[slider.index][slider.fieldName].min;
              // sliderEl.max = vals[slider.index][slider.fieldName].max;

              const minVal = (sliderInputMin.value =
                vals[slider.index][slider.fieldName].min);
              const maxVal = (sliderInputMax.value =
                vals[slider.index][slider.fieldName].max);

              let minStr;
              let maxStr;

              if (slider.fieldName !== "Total_Acres") {
                minStr = "$" + minVal.toLocaleString();
                maxStr = "$" + maxVal.toLocaleString();
              } else {
                minStr = minVal.toLocaleString();
                maxStr = maxVal.toLocaleString();
              }

              sliderInputMin.value = minStr;
              sliderInputMax.value = maxStr;
            }
          });
        }

        async function buildQueries() {
          let queryValues = [];
          let queryFields = [
            "Appraised_Total",
            "Assessed_Total",
            "Total_Acres",
            "Sale_Date",
            "Sale_Price",
          ];

          for (let field of queryFields) {
            let query = CondosTable.createQuery();
            query.outStatistics = [
              {
                statisticType: "max",
                onStatisticField: field,
                outStatisticFieldName: "maxValue",
              },
              {
                statisticType: "min",
                onStatisticField: field,
                outStatisticFieldName: "minValue",
              },
            ];

            try {
              let response = await CondosTable.queryFeatures(query);
              let valPair;
              if (field === "Sale_Date") {
                let max = new Date(response.features[0].attributes.maxValue);
                let min = new Date(response.features[0].attributes.minValue);
                // console.log(max);
                // console.log(min);
                // console.log(min.getFullYear());
                // console.log(max.getFullYear());
                valPair = {
                  [field]: {
                    min: min,
                    max: max,
                  },
                };
              } else {
                let max = response.features[0].attributes.maxValue;
                let min = response.features[0].attributes.minValue;
                valPair = {
                  [field]: {
                    min: min,
                    max: max,
                  },
                };
              }
              queryValues.push(valPair);
            } catch (error) {
              console.error("Error querying features:", error);
            }
          }

          changeSliderValues(queryValues);
        }

        buildQueries();

        $("#submitFilter").on("click", function () {
          updateQuery();
        });

        function clearQueryParameters() {
          $("#lasso").removeClass("btn-warning");
          // $("#select-button").removeClass("btn-warning");
          $("#searchInput ul").remove();
          $("#searchInput").val = "";
          // $("#side-Exp2").addClass("disabled");

          // Get a reference to the search input field
          const searchInput = document.getElementById("searchInput");

          // To clear the text in the input field, set its value to an empty string
          searchInput.value = "";
          runQuerySearchTerm = "";
          searchTerm = "";
          firstList = [];
          secondList = [];

          $("#result-btns").hide();
          $("#details-btns").hide();
          $("#abut-mail").hide();
          $("#dropdown").hide();
          $("#right-arrow-2").show();
          $("#left-arrow-2").hide();
          $("#abutters-content").hide();
          $("#selected-feature").empty();
          $("#parcel-feature").empty();
          $("#backButton").show();
          $("#exportResults").hide();
          $("#csvExportResults").hide();
          $("#csvExportSearch").hide();
          $("#exportSearch").hide();
          $("#total-results").hide();
          $("#ResultDiv").hide();
          $("#featureWid").hide();
          $("#exportButtons").hide();
          $("#dropdown").show();
          $("#WelcomeBox").hide();
          $("#select-button").attr("title", "Add to Selection Enabled");

          let suggestionsContainer = document.getElementById("suggestions");
          suggestionsContainer.innerHTML = "";

          $("#distanceButton").removeClass("btn-warning");
          $("#distanceButton").addClass("bg-info");
          $("#areaButton").removeClass("btn-warning");
          $("#distanceButton").addClass("bg-info");
          $("#featureWid").empty();

          view.ui.remove(activeWidget1);
          if (activeWidget1) {
            activeWidget1.destroy();
            activeWidget1 = null;
          }

          detailsHandleUsed == "";
          view.graphics.removeAll();
          polygonGraphics = [];
          Object.keys(queryParameters).forEach((key) => {
            queryParameters[key] = null;
          });

          // put this in its own function
          // can use this for setting the values and clearing them
          // keep clearQueryParamters for just resetting other values
          const combobox1ID = document.querySelector("#streetFilter");
          const combobox2ID = document.querySelector("#ownerFilter");
          const combobox3ID = document.querySelector("#propertyFilter");
          const combobox4ID = document.querySelector("#buildingFilter");
          const combobox5ID = document.querySelector("#buildingUseFilter");
          const combobox6ID = document.querySelector("#designTypeFilter");
          const combobox7ID = document.querySelector("#zoningFilter");
          const combobox8ID = document.querySelector("#neighborhoodFilter");
          const soldOnLowest = document.querySelector("#sold_calendar_lowest");
          const soldOnHighest = document.querySelector(
            "#sold_calendar_highest"
          );

          combobox1ID.selectedItems = [];
          combobox2ID.selectedItems = [];
          combobox3ID.selectedItems = [];
          combobox4ID.selectedItems = [];
          combobox5ID.selectedItems = [];
          combobox6ID.selectedItems = [];
          combobox7ID.selectedItems = [];
          combobox8ID.selectedItems = [];

          combobox1ID.filteredItems.forEach((item) => {
            item.active = false;
            item.selected = false;
          });

          combobox2ID.filteredItems.forEach((item) => {
            item.active = false;
            item.selected = false;
          });

          combobox3ID.filteredItems.forEach((item) => {
            item.active = false;
            item.selected = false;
          });

          combobox4ID.filteredItems.forEach((item) => {
            item.active = false;
            item.selected = false;
          });

          combobox5ID.filteredItems.forEach((item) => {
            item.active = false;
            item.selected = false;
          });

          combobox6ID.filteredItems.forEach((item) => {
            item.active = false;
            item.selected = false;
          });

          combobox7ID.filteredItems.forEach((item) => {
            item.active = false;
            item.selected = false;
          });

          combobox8ID.filteredItems.forEach((item) => {
            item.active = false;
            item.selected = false;
          });

          combobox1ID.value = "";
          combobox2ID.value = "";
          combobox3ID.value = "";
          combobox4ID.value = "";
          combobox5ID.value = "";
          combobox6ID.value = "";
          combobox7ID.value = "";
          combobox8ID.value = "";

          soldOnLowest.value = "";
          soldOnHighest.value = "";
          soldOnLowest.activeDate = null;
          soldOnHighest.activeDate = null;

          buildQueries();

          $(".wrapper .x-button").click();
          $("#streetFilter").value = "";
        }

        $("#clearFilter").on("click", function () {
          clearQueryParameters();
        });
      });

      $(document).ready(function () {
        $("#side-Exp").on("click", function () {
          $("#sidebar").toggleClass("collapsed");
          if ($("#sidebar").hasClass("collapsed")) {
            $("#small-div").css("right", "0px");
            $("#right-arrow").hide();
            $("#left-arrow").show();
          } else {
            $("#small-div").css("right", "250px");
            $("#left-arrow").hide();
            $("#right-arrow").show();
          }
        });
      });

      $(document).ready(function () {
        $("#Basemap-selector").on("click", function () {
          $("#rightPanel").hide();
          $("#BookmarksDiv").hide();
          $("#AddDataDiv").hide();
          $("#ContactDiv").hide();
          $("#PrintDiv").hide();
          $("#LegendDiv").hide();
          $("#Right-Btn-div").show();
          $("#BasemapDiv").show();
          $("#group-container-right").show();
        });

        $("#Bookmarks-selector").on("click", function () {
          $("#rightPanel").hide();
          $("#BasemapDiv").hide();
          $("#AddDataDiv").hide();
          $("#ContactDiv").hide();
          $("#PrintDiv").hide();
          $("#LegendDiv").hide();
          $("#Right-Btn-div").show();
          $("#BookmarksDiv").show();
          $("#group-container-right").show();
        });

        // $("#Print-selector").on("click", function () {
        //   $("#rightPanel").hide();
        //   $("#BookmarksDiv").hide();
        //   $("#AddDataDiv").hide();
        //   $("#ContactDiv").hide();
        //   $("#BasemapDiv").hide();
        //   $("#Right-Btn-div").show();
        //   $("#PrintDiv").show();
        //   $("#LegendDiv").hide();
        //   $("#group-container-right").show();
        // });

        $("#Contact-selector").on("click", function () {
          $("#rightPanel").hide();
          $("#BookmarksDiv").hide();
          $("#AddDataDiv").hide();
          $("#BasemapDiv").hide();
          $("#Right-Btn-div").hide();
          $("#PrintDiv").hide();
          $("#Right-Btn-div").show();
          $("#ContactDiv").show();
          $("#PrintDiv").hide();
          $("#LegendDiv").hide();
          $("#group-container-right").show();
        });

        $("#addData-selector").on("click", function () {
          $(document).keypress(function (event) {
            if (event.key === "Enter") {
              event.preventDefault();
            }
          });
          $("#rightPanel").hide();
          $("#BookmarksDiv").hide();
          $("#BasemapDiv").hide();
          $("#Right-Btn-div").hide();
          $("#PrintDiv").hide();
          $("#ContactDiv").hide();
          $("#Right-Btn-div").show();
          $("#AddDataDiv").show();
          $("#PrintDiv").hide();
          $("#LegendDiv").hide();
          $("#group-container-right").show();
        });

        // $("#Print-selector").on("click", function () {
        //   $("#rightPanel").hide();
        //   $("#BookmarksDiv").hide();
        //   $("#BasemapDiv").hide();
        //   $("#Right-Btn-div").hide();
        //   $("#PrintDiv").hide();
        //   $("#ContactDiv").hide();
        //   $("#Right-Btn-div").show();
        //   $("#AddDataDiv").hide();
        //   $("#PrintDiv").show();
        //   $("#LegendDiv").hide();
        //   $("#group-container-right").show();
        // });

        $("#Legend-selector").on("click", function () {
          $("#rightPanel").hide();
          $("#BookmarksDiv").hide();
          $("#BasemapDiv").hide();
          $("#Right-Btn-div").hide();
          $("#PrintDiv").hide();
          $("#ContactDiv").hide();
          $("#Right-Btn-div").show();
          $("#AddDataDiv").hide();
          $("#PrintDiv").hide();
          $("#LegendDiv").show();
          $("#group-container-right").show();
        });

        $("#right-btn-back").on("click", function () {
          $("#group-container-right").hide();
          $("#PrintDiv").hide();
          $("#AddDataDiv").hide();
          $("#BookmarksDiv").hide();
          $("#BasemapDiv").hide();
          $("#Right-Btn-div").hide();
          $("#ContactDiv").hide();
          $("#LegendDiv").hide();
          $("#rightPanel").show();
        });
      });

      // Scale mapping
      var scaleMapping = {
        240: "1 inch = 20 feet",
        600: "1 inch = 50 feet",
        1200: "1 inch = 100 feet",
        2400: "1 inch = 200 feet",
        6000: "1 inch = 500 feet",
        9600: "1 inch = 800 feet",
        18000: "1 inch = 1500 feet",
        36000: "1 inch = 3000 feet",
        72000: "1 inch = 6000 feet",
        144000: "1 inch = 12000 feet",
      };

      // Add event listener for scale selection
      var scaleDropdown = document.getElementById("scale-dropdown");

      document.querySelectorAll(".scale-select").forEach(function (button) {
        button.addEventListener("click", function (event) {
          var selectedScale = parseInt(event.target.value);
          var selectedText = event.target.innerHTML;
          if (selectedScale) {
            view.scale = selectedScale;
          }

          $("#scale-value").val(selectedScale).html(selectedText);
        });
      });

      view.ui.add(scaleDropdown, {
        position: "bottom-left",
      });

      // Watch for changes in the view's scale and update the dropdown
      const handle = reactiveUtils.watch(
        () => [view.stationary, view.scale],
        ([stationary, scale]) => {
          // Only print the new scale value when the view is stationary
          if (stationary) {
            console.log(`Change in scale level: ${scale}`);
            updateScaleDropdown(scale);
          }
        }
      );

      function updateScaleDropdown(scale) {
        var roundedScale = Math.round(scale);
        var scaleText = getScaleText(roundedScale);

        if (scaleText) {
          $("#scale-value").val(roundedScale).html(scaleText);
        }
      }

      function getScaleText(scale) {
        // Find the closest scale in the mapping
        var closestScale = Object.keys(scaleMapping).reduce(function (
          prev,
          curr
        ) {
          return Math.abs(curr - scale) < Math.abs(prev - scale) ? curr : prev;
        });

        return scaleMapping[closestScale];
      }

      // view.add(scaleDropdown, "bottom-right");

      $(document).ready(function () {
        $("#popoverButton").popover({
          trigger: "hover",
        });
      });

      $(document).ready(function () {
        $("#lasso").popover({
          trigger: "hover",
        });
      });

      $(document).ready(function () {
        $("#select-button").popover({
          trigger: "hover",
        });
      });

      $(document).ready(function () {
        $("#clear-btn1").popover({
          trigger: "hover",
        });
      });

      $(document).ready(function () {
        $("#filterButton").popover({
          trigger: "hover",
        });
      });

      $(document).ready(function () {
        $("#layerListBtn").popover({
          trigger: "hover",
        });
      });

      $(document).ready(function () {
        $("#abutters-attributes").popover({
          trigger: "hover",
        });
      });

      $(document).ready(function () {
        $("#abutters-zoom").popover({
          trigger: "hover",
        });
      });

      $(document).ready(function () {
        $("#distanceButton").popover({
          trigger: "hover",
        });
      });

      $(document).ready(function () {
        $("#areaButton").popover({
          trigger: "hover",
        });
      });

      function clickRefreshButton() {
        var refreshButton = document.querySelector(
          ".esri-widget--button.esri-print__refresh-button.esri-icon-refresh"
        );
        if (refreshButton) {
          refreshButton.click();
        }
      }

      // Watch for changes in the zoom level
      view.watch("zoom", function (newValue, oldValue) {
        if (newValue !== oldValue) {
          clickRefreshButton();
        }
      });

      // Optionally, watch for changes in the center (pan)
      view.watch("center", function (newValue, oldValue) {
        if (newValue !== oldValue) {
          clickRefreshButton();
        }
      });

      $(document).ready(function () {
        $("#side-Exp2").on("click", function () {
          if ($("#sidebar2").hasClass("collapsed")) {
            $("#results-div").css("left", "0px");
            $("#sidebar2").css("left", "-350px");
            $("#right-arrow-2").show();
            $("#left-arrow-2").hide();
          } else {
            $("#results-div").css("left", "350px");
            $("#sidebar2").css("left", "0px");
            $("#left-arrow-2").show();
            $("#right-arrow-2").hide();
          }
          $("#sidebar2").toggleClass("collapsed");
        });
      });
    });
});
