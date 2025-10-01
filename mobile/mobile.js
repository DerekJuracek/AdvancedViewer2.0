require([
  "esri/WebMap",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/core/reactiveUtils",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/widgets/BasemapLayerList",
  "esri/renderers/SimpleRenderer",
], function (
  WebMap,
  MapView,
  FeatureLayer,
  reactiveUtils,
  Graphic,
  GraphicsLayer,
  BasemapLayerList,
  SimpleRenderer
) {
  const urlParams = new URLSearchParams(window.location.search);
  let currentURL = window.location.href;
  let configUrl = urlParams.get("viewer");

  const configFiles = [
    "canaanct",
    "colebrookct",
    "colebrookctassessor",
    "columbiact",
    "cornwallct",
    "durhamct",
    "franklinct",
    "haddamct",
    "northcanaanct",
    "roxburyct",
    "roxburyctassessor",
    "salisburyct",
    "scotlandct",
    "warrenct",
    "warrenctassessor",
    "washingtonct",
    "wiltonct",
    "wolcottct",
    "woodbridgect"
  ];

  // Create a regex pattern to match allowed config file names
  let allowedNamesPattern = configFiles.join("|");
  let urlPattern = new RegExp(`\\?viewer=cama\\/(${allowedNamesPattern})(\\&\\w+=[\\w-]+)*$`);
  

  if (configUrl != null && urlPattern.test(currentURL)) {
    configUrl = configUrl + ".json";

    //$("#whole-app").show();
  } else if (
    window.location.href === "https://terrenogis.com" ||
    window.location.href === "https://terrenogis.com/"
  ) {
    // Navigate to the specified URL in the current tab
    window.location.href = "https://www.qds.biz/gis-service";
  } else {
    window.location.href = "./onload.html";
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
      configVars.mapId = config.webmapId || "6448b08504de4244973a28305b18271f";
      configVars.condoLayer = config.condoLayer;
      configVars.noCondoLayer = config.noCondoLayer;
      configVars.title = config.title;
      configVars.isCondosLayer = config.condos;
      configVars.masterTable = config.masterTable;
      configVars.parcelZoom = config.parcelZoom;
      configVars.imageUrl = config.imageUrl;
      configVars.welcomeImage = config.welcomeImage;
      configVars.pdf_Image = config.pdf_Image;
      configVars.pdf_demo = config.pdf_demographics;
      configVars.taxMap_Url = config.taxMapUrl;
      configVars.parcelMapUrl = config.parcelMapUrl;
      configVars.housingUrl = config.housingUrl;
      configVars.propertyCardPdf = config.propertyCardPdf;
      configVars.propertyCard = config.propertyCard;
      configVars.tax_bill = config.tax_bill;
      configVars.useVisionForTaxBillUrl = config.useVisionForTaxBillUrl;
      configVars.accessorName = config.accessorName;
      configVars.parcelTitle = config.parcelServiceTitle;
      configVars.tabTitle = config.tabTitle;
      configVars.basemapTitle = config.basemapTitle;
      configVars.parcelRenderer = config.parcelRenderer;
      configVars.useUniqueIdforParcelMap = config.useUniqueIdforParcelMap;
      configVars.helpUrl = config.helpUrl;
      configVars.includeFilter = config.includeFilter;
      configVars.customWelcomePage = config.customWelcomePage;
      configVars.customWelcomeMessage = config.customWelcomeMessage;
      configVars.showDisclaimer = config.showDisclaimer;
      configVars.customDisclaimerPage = config.customDisclaimerPage;
      configVars.customDisclaimerMessage = config.customDisclaimerMessage;
      configVars.DetailLinks = config.DetailLinks;
      configVars.DetailLinksToInclude = config.DetailLinksToInclude;
      configVars.includePermitLink = config.includePermitLink;
      configVars.scale = config.scale;
    


    //document.getElementById("AccessorName").innerHTML = config.accessorName;
      $(".help-url").attr("href", configVars.helpUrl);
      // document.getElementById("title").innerHTML = configVars.title;

    const key = "condos";
    const key2 = "No geometry";
  

    const clearBtn = document.getElementById("clear-btn");
    const searchGraphicsLayers = new GraphicsLayer();
    let firstList = [];
    let urlSearchUniqueId;
    let queryParameters;
    let polygonGraphics;
    let runQuerySearchTerm;
    let isGisLink;
    let clickedToggle;
    let oldExtent;
    let oldScale;
    let oldZoom;
    let zoomToDetails = true;
    let triggerfromNoCondos = false;
    let triggeredDetailsZoom = false;
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
        scale: configVars.scale,
        popupEnabled: false,
        ui: {
          components: ["attribution"],
        },
      });

      view.when(() => {
        configVars.homeExtent = view.extent;
      });

      const noCondosLayer = new FeatureLayer({
        url: `${configVars.noCondoLayer}`,
        visible: false,
        popupEnabled: true,
        title: "Parcel Boundaries",
        id: "noCondoLayer",
      });

      const CondosLayer = new FeatureLayer({
        url: `${configVars.condoLayer}`,
        visible: false,
        popupEnabled: true,
        title: "Parcel Boundaries",
        id: "condoLayer",
      });

      webmap.add(noCondosLayer);
      webmap.add(CondosLayer);

      const CondosTable = new FeatureLayer({
        url: `${configVars.masterTable}`,
      });

       const noCondosTable = new FeatureLayer({
        url: `${configVars.masterTable}`,
      });

      oldExtent = view.extent;
      oldScale = view.scale;
      oldZoom = view.zoom;

    view.on("click", handleClick)

    function handleClick(event) {
        clearContents()
        detailsHandleUsed = "click";
        triggerfromNoCondos = false;

       

        if (sessionStorage.getItem("condos") === "no") {
          let query = noCondosLayer.createQuery();
          query.geometry = event.mapPoint;
          query.spatialRelationship = "intersects";
          query.returnGeometry = true;
          query.outFields = ["*"];

          noCondosLayer.queryFeatures(query).then(function (response) {
            if (response.features) {
              totalResults = response.features;
              processFeatures(totalResults, "", event);
              addPolygons(response, view.graphics);
            } else {
              return;
            }
          });
        } else {
          let query2 = CondosLayer.createQuery();
          query2.geometry = event.mapPoint;
          query2.spatialRelationship = "intersects";
          query2.returnGeometry = true;
          query2.outFields = ["*"];

          CondosLayer.queryFeatures(query2).then(function (response) {
            if (response.features) {
              totalResults = response.features;
              processFeatures(totalResults, "", event);
              addPolygons(response, view.graphics);
            } else {
              return;
            }
          });
        }
      }

       reactiveUtils.watch(
        () => [view.zoom, view.extent, view.scale],
        ([zoom, extent, scale], [wasStationary]) => {
          if (zoom) {
            if (zoom !== oldZoom) {
              oldZoom = zoom;
            }

            if (!noCondosLayer.visible && !CondosLayer.visible) {
              if (Number(zoom) > configVars.parcelZoom) {
                if (sessionStorage.getItem("condos") === "no") {
                  noCondosLayer.visible = true;
                } else {
                  CondosLayer.visible = true;
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

         
      function toggleLayerVisibility(layerId, actionElement) {
        let layer = webmap.findLayerById(layerId);

        if (layer) {
          layer.visible = !layer.visible;
          if (layer.type === "group") {
            layer.layers.forEach((subLayer) => {
              subLayer.visible = layer.visible;
            });
          }


          actionElement.attr("icon", layer.visible ? "check-square" : "square");
        }
      }

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
          layer.title == "Parcel Boundaries" ||
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
          var item = $(`
          <calcite-list-item scale="m" label="${layer.title}" value="${layer.id}" style="border: white 0.5px solid;">
          <calcite-action class="toggle-slider" id="action-${layer.id}-dropdown" slot="actions-end" icon="sliders-horizontal" text="${layer.title}"></calcite-action>
            <calcite-action class="layer-vis" id="action-${layer.id}" slot="actions-end" icon="${icon}" text="${layer.title}"></calcite-action>
            <div id="opacityDiv-${layer.id}" class="esri-slider esri-widget esri-slider--horizontal opacity-div " touch-action="none" style="display: none; height: 45px; align-items: center; padding-bottom: 10px; padding-left: 10px;">
              <label style="margin-right: 10px; padding-top: 20px; font-weight: 500;font-size: 12px;">Layer Opacity (%)</label>
              <calcite-slider class="slider-opacity" id="${layer.id}" style="width: 50%;" value="100" label-handles max-label="100" max-value="100" min-label="0"></calcite-slider>
              </calcite-slider>
            </div>
          </calcite-list-item>
      `);

          container.append(item);
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

            container.append(accordionItem);
          } else {
            addLayerToPickList(layer, container);
          }
        });
      }
   
   $("#layerList").on("click", ".layer-vis", function (event) {
        event.preventDefault();

        let layerId = $(this).closest("calcite-list-item").attr("value");

        toggleLayerVisibility(layerId, $(this));
      });

    $(document).ready(function () {
        // Attach the event listener to a parent element, like 'body' or a wrapper around the list
        $("body").on("click", ".toggle-slider", function () {
          // Find the closest layer-item and toggle the opacity div inside it
          $(this).closest("calcite-list-item").find(".opacity-div").toggle();
        });
      });

        function addSliderEvents() {
        $(".slider-opacity").on("calciteSliderChange", function (event) {
          const Id = event.target.id;
          let layer = webmap.findLayerById(Id);
          let opacityValue = event.target.value / 100; 
          layer.opacity = opacityValue; 
        });
      }

    
      view.when(function () {
        var pickListContainer = $("#layerList");
        var layers = webmap.layers.items; 

        processLayers(layers, pickListContainer);
        addSliderEvents();
      });

      view.when(() => {
  const basemaps = new BasemapLayerList({
    view: view,
    container: $(".basemaps")[0],
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
    "Aerial-Ortho 2023",
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
        layer.renderer = new SimpleRenderer(newRenderer);
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

  // NEW: Add individual watches on each base layer's visible property
  // This replaces the array-map watch and should be more reliable on mobile
  const visibilityWatchHandles = []; // Store handles to clean up if needed
  view.map.basemap.baseLayers.forEach((layer) => {
    const handle = reactiveUtils.watch(
      () => layer.visible,
      () => {
        manageBasemapVisibility(view.map.basemap.baseLayers, layerVisibility);
      }
    );
    visibilityWatchHandles.push(handle);
  });

  // Runs every time the basemap changes (e.g. imagery swap on mobile)
  reactiveUtils.watch(
    () => view.map.basemap,
    () => {
      manageBasemapVisibility(view.map.basemap.baseLayers, layerVisibility);
      // OPTIONAL: If basemap can be fully replaced, re-attach individual watches here
      // visibilityWatchHandles.forEach(handle => handle.remove());
      // visibilityWatchHandles.length = 0;
      // Then re-add watches as above for the new baseLayers
    }
  );

  // REMOVE this, as it's replaced by individual watches
  // reactiveUtils.watch(
  //   () => view.map.basemap.baseLayers.map((layer) => layer.visible),
  //   () => {
  //     manageBasemapVisibility(
  //       view.map.basemap.baseLayers,
  //       layerVisibility
  //     );
  //   }
  // );

  function manageBasemapVisibility(baseLayers, visibilityTracker) {
    // alert('triggering basemap')
    let newlyVisibleLayer = baseLayers.find(
      (layer) => layer.visible && !visibilityTracker[layer.id]
    );

    if (newlyVisibleLayer) {
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
          alert('tried to change renderer')
          CondosLayer.renderer = new SimpleRenderer(newRenderer);
        } else {
          alert('tried to change renderer')
          noCondosLayer.renderer = new SimpleRenderer(newRenderer);
        }
      } else {
        // Revert to the original renderer if the basemap is the configured basemap title or "Washington Basemap"
        view.map.allLayers.forEach((layer) => {
          if (layer.title === "Parcel Boundaries") {
            layer.renderer = OG;
          }
          alert('default renderer')
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
      }
    }

    // Update visibility tracker
    baseLayers.forEach((layer) => {
      visibilityTracker[layer.id] = layer.visible;
    });
  }
});

      function formatDate(timestamp) {
        var date = new Date(timestamp);
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();
        return month + "/" + day + "/" + year;
      }

      function CheckResident(searchTerm, feature) {
        const Location = feature.attributes?.Location
        const containsSearchTerm = Location.includes(searchTerm)
        return containsSearchTerm
      }

      function buildParcelList(feature) {
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
          let Image_Path = feature.attributes["Image_Path"];
          let AcctNum = feature.attributes["AcctNum"];
          let Match_Status = feature.attributes["Match_Status"];
          let Account_Type = feature.attributes["ACCOUNT_TYPE"];

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
              Lon,
              Image_Path,
              AcctNum,
              Match_Status,
              Account_Type
            )
          );
      }

      function buildFilterQuery(query) {
          let tableQuery;
            if (sessionStorage.getItem("condos") === "no") {
              tableQuery = noCondosLayer.createQuery();
              tableQuery.where = query.where;
              tableQuery.returnDistinctValues = false;
              tableQuery.returnGeometry = true;
              tableQuery.outFields = ["*"];
            } else {
              tableQuery = CondosLayer.createQuery();
              tableQuery.where = query.where;
              tableQuery.returnDistinctValues = false;
              tableQuery.returnGeometry = true;
              tableQuery.outFields = ["*"];
            }

          return tableQuery;
      }

      function sortByOwner(arr) {
        return arr.sort((a, b) => {
          const ownerA = a.owner ? a.owner.toLowerCase() : "";
          const ownerB = b.owner ? b.owner.toLowerCase() : "";
          return ownerA.localeCompare(ownerB);
        });
    }

    function getUniqueArray(firstList) {
      let seenIds = new Set();
      let seenUID = new Set();
      let uniqueArray = firstList.filter((obj) => {
        if (obj.geometry) {
          seenIds.add(obj.uniqueId);
          return true;
        }
        return false;
      });

        firstList.forEach((obj) => {
          if (!seenIds.has(obj.uniqueId)) {
            seenUID.add(obj.uniqueId);
            uniqueArray.push(obj);
          }
        });

      return { uniqueArray, seenIds };
    }

    function hasDuplicateObjectId(objectId, list) {
      return list.filter((g) => g.objectid === objectId).length > 1;
    }

    function removeDuplicates(list, objectId, location, gisLink) {
      if (sessionStorage.getItem("condos") === "yes") {
        $(`li[object-id="${objectId}"]`).remove();
        return list.filter(item => item.objectid !== objectId);
      } else {
        $(`li[data-id="${gisLink}"]`).remove();
        return list.filter(item => item.GIS_LINK !== gisLink);
      }
    }

    function zoomToFeature(objectid, gisLink, triggerList) {
        view.graphics.removeAll(polygonGraphics);

        detailsChanged = {
          isChanged: false,
          item: "",
        };
        isGisLink = [];
        let bufferGraphicId = "uniqueBufferGraphicId";
        const existingBufferGraphicIndex = view.graphics.items.findIndex(
          (g) => g.id === bufferGraphicId
        );

        if (existingBufferGraphicIndex > -1) {
          view.graphics.removeAt(existingBufferGraphicIndex);
        }

        isGisLink = firstList.filter((obj) => obj.GIS_LINK == gisLink);

        // if "no condos" and GIS_LINK is equal to firstlist(means its searched by GIS_LINK)
        // and GIS_LINK > 1( not searched on one uniqueid w/ no geometry) or will error
        // so say selected a condomain with 111 condos, checks against 1st list
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

              const geometryExtent = targetExtent.extent;
            const zoomOutFactor = 3.0;
            const newExtent = geometryExtent.expand(zoomOutFactor);


            const polygonGraphic = new Graphic({
              geometry: targetExtent,
              symbol: fillSymbol,
              id: bufferGraphicId,
            });

            view.graphics.addMany([polygonGraphic]);

            if (!zoomToDetails) {
              return 
            } else {
              view
              .goTo({
                target: polygonGraphic,
                extent: newExtent,
                // zoom: 15,
              })
              .catch(function (error) {
                if (error.name != "AbortError") {
                  console.error(error);
                  // NoZoomDetails = true;
                }
              });
       
            }

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

              const geometryExtent = targetExtent.extent;
              const zoomOutFactor = 4.0;
              const newExtent = geometryExtent.expand(zoomOutFactor);

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


              if (!zoomToDetails) {
                return 
              } else {
                 view
                .goTo({
                  target: geometry,
                  extent: newExtent,
                  // zoom: 15,
                })
                .catch(function (error) {
                  if (error.name != "AbortError") {
                    console.error(error);
                    // NoZoomDetails = true;
                  }
                });
              }
          }
        } else {
          CondoBuffer = true;
          let matchingObject
          if (triggerList) {
            matchingObject = firstList.filter(
              (obj) =>obj.uniqueId == objectid
            );
          } else {
            matchingObject = firstList.filter(
              (obj) =>obj.objectid == objectid
            );
          }
        
          // this is where its actually working on click
          // not on uniqueid search
          // whats the difference?
          if (matchingObject.length > 0) {
            if (
              matchingObject[0].geometry != null &&
              matchingObject[0].geometry != ""
            ) {
              detailsGeometry = matchingObject[0].geometry;
              const geometryExtent = detailsGeometry.extent;
              const zoomOutFactor = 4.0;
              const newExtent = geometryExtent.expand(zoomOutFactor);

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

              if (!zoomToDetails) {
                return
              } else {
                view
                .goTo({
                  target: detailsGeometry,
                  extent: newExtent,
                  // zoom: 15,
                })
                .catch(function (error) {
                  if (error.name != "AbortError") {
                    console.error(error);
                  }
                });
              }

            } else {
              let whereClause;
              CondoBuffer = false;

              let match = matchingObject.filter((item) => {
                item.GIS_LINK === gisLink;
              });

              if (match) {
                whereClause = `GIS_LINK = '${gisLink}'`;
              } else {
                whereClause = `GIS_LINK = '${matchingObject[0].GIS_LINK}'`;
              }

              let query = noCondosLayer.createQuery();
              query.where = whereClause;
              query.returnGeometry = true;
              query.returnHiddenFields = true; // Adjust based on your needs
              query.outFields = ["*"];

              noCondosLayer.queryFeatures(query).then((response) => {
                let feature = response;
                let geometry = feature.features[0].geometry;

                detailsGeometry = geometry;
                targetExtent = geometry;

                const geometryExtent = targetExtent.extent;
                const zoomOutFactor = 4.0;
                const newExtent = geometryExtent.expand(zoomOutFactor);

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
                if (!zoomToDetails) {
                  return
                } else {
                view
                .goTo({
                  target: geometry,
                  extent: newExtent,
                  // zoom: 15,
                })
                  .catch(function (error) {
                    if (error.name != "AbortError") {
                      console.error(error);
                      // NoZoomDetails = true;
                    }
                  });
                }
              });
            }
          }
        }
      }

    function setupClickHandlers(listGroup) {
       listGroup.addEventListener("click", function (event) {
          let shouldZoomTo = true;
          if (
            event.target.closest(".justZoom") ||
            event.target.closest(".justZoomBtn") ||
            event.target.closest(".pdf-links")
          ) {
            return; // Exit the handler early if a button was clicked
          }
      
          let targetElement = event.target.closest("li");
          if (!targetElement) return;

          // Now you can handle the click event as you would in the individual event listener
          let itemId = targetElement.getAttribute("data-id");
          let objectID = targetElement.getAttribute("object-id");
    
          if (triggeredDetailsZoom) {
            return
          } else {
            zoomToFeature(objectID,  itemId);
          }
         
          if (event.target.closest(".no-zoomto")) {
            shouldZoomTo = false;
          }
          //buildDetailsPanel(objectID, itemId, shouldZoomTo);
        });
    }

    function buildList(uniqueArray) {
       const resultDiv = document.getElementById("results");
        const listGroup = document.createElement("ul");

        let zoomToItemId;
        let Id;
        if (uniqueArray.length == 1) {
          zoomToDetails = false;
        }

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
          // let accountType = feature.Parcel_Type;

          if (configVars.useUniqueIdforParcelMap === "yes") {
            zoomToItemId = locationUniqueId;
            Id = locationUniqueId;
          } else {
            zoomToItemId = locationGISLINK;
            Id = locationGISLINK;
          }

          let ImagePath = feature.Image_Path;
          let VisionAct = feature.AcctNum === undefined ? "" : feature.AcctNum;
          const imageUrl = `${configVars.imageUrl}${ImagePath}`;

          listGroup.classList.add("row");
          listGroup.classList.add("list-group");

          const listItem = document.createElement("li");
          const imageDiv = document.createElement("li");
          const linksDiv = document.createElement("tr");

          // Creating the new li for links that will span the full width (col-12)
          linksDiv.classList.add("col-12", "list-group-item");

            // Constructing the initial part of the inner HTML
            let linksHTML = `<div class="extra-links">
            <a target="_blank" class='pdf-links mx-2' rel="noopener noreferrer" href=https://publicweb-gis.s3.amazonaws.com/PDFs/${configVars.parcelMapUrl}/Quick_Maps/QM_${Id}.pdf><span style="font-family:Tahoma;font-size:12px;"><strong>PDF Map</strong></a>`
            if (configVars.propertyCardPdf == "yes") {
              linksHTML += `<a target="_blank" class='pdf-links mx-2' rel="noopener noreferrer" href=${configVars.propertyCard}${locationUniqueId}.PDF><span style="font-family:Tahoma;font-size:12px;"><strong>Property Card</strong></a>`;
            } else {
              linksHTML += `<a target="_blank" class='pdf-links mx-2' rel="noopener noreferrer" href=${configVars.propertyCard}${locationUniqueId}><span style="font-family:Tahoma;font-size:12px;"><strong>Property Card</strong></a>`;
            }

          if (configVars.useVisionForTaxBillUrl === "yes") {
            linksHTML += `<a target="_blank" class='pdf-links mx-2' rel="noopener noreferrer" href=${configVars.tax_bill}&amp;uniqueId=${VisionAct}><span style="font-family:Tahoma;font-size:12px;"><strong>Tax Bills</strong></span></a>`;
          } else {
            linksHTML += `<a target="_blank" class='pdf-links mx-2' rel="noopener noreferrer" href=${configVars.tax_bill}&amp;uniqueId=${locationUniqueId}><span style="font-family:Tahoma;font-size:12px;"><strong>Tax Bills</strong></span></a>`;
          }

          // Conditionally add the "Permits" link if the variable allows it
          if (configVars.includePermitLink === "yes") {
            linksHTML += `<a target="_blank" class='pdf-links mx-2' rel="noopener noreferrer" href=${configVars.permitLink}?uniqueid=${locationUniqueId} ><span style="font-family:Tahoma;font-size:12px;"><strong>Permits</strong></a>`;
          }

          // Closing the div
          linksHTML += `</div>`;

          // Set the inner HTML of the linksDiv
          linksDiv.innerHTML = linksHTML;

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
            listItemHTML = ` <div class="listText">UID: ${locationUniqueId}  &nbsp;<br>MBL: ${locationMBL} <br> ${locationOwner} ${locationCoOwner} <br> ${locationVal} <br> Property Type: ${propertyType}</div>
            <div class="justZoomBtn"><button type="button" class="btn btn-primary btn-sm justZoom" title="Zoom to Parcel"><calcite-icon icon="magnifying-glass-plus" scale="s"/>Zoom</button></div>`;
          } else if (!locationGeom) {
            listItemHTML = ` <div class="listText noGeometry">UID: ${locationUniqueId}  &nbsp;<br>MBL: ${locationMBL} <br> ${locationOwner} ${locationCoOwner} <br> ${locationVal} <br> Property Type: ${propertyType} 
             </div></div>`;
            listItem.classList.add("no-zoomto");
          } else {
            listItemHTML = ` <div class="listText">UID: ${locationUniqueId}  &nbsp;<br>MBL: ${locationMBL} <br> ${locationOwner} ${locationCoOwner} <br> ${locationVal} <br> Property Type: ${propertyType}</div>
            <div class="justZoomBtn"><button type="button" class="btn btn-primary btn-sm justZoom" title="Zoom to Parcel"><calcite-icon icon="magnifying-glass-plus" scale="s"/>Zoom</button></div>`;
          }

          // Append the new list item to the list
          listItem.innerHTML += listItemHTML;
          listItem.setAttribute("object-id", objectID);
          listItem.setAttribute("data-id", locationGISLINK);

          listGroup.appendChild(imageDiv);
          listGroup.appendChild(listItem);
          listGroup.appendChild(linksDiv);
        })

        setupClickHandlers(listGroup);
        resultDiv.appendChild(listGroup);
    }


      function buildResultsPanel(
        features,
        polygonGraphics,
        e,
        pointGraphic,
        pointLocation,
        pointGisLink
      ) {
        $("status-loader").show();
        $("#results").empty();

        let triggerfromNoCondos = false;

        let { uniqueArray, seenIds } = getUniqueArray(firstList);
        uniqueArray = sortByOwner(uniqueArray);

         if (!triggerfromNoCondos && hasDuplicateObjectId(pointGraphic, firstList)) {
            uniqueArray = removeDuplicates(uniqueArray, pointGraphic, pointLocation, pointGisLink);
         }

        buildList(uniqueArray)
        const defaultTarget = $(".action-btn").first().data("target");
        toggleContent(defaultTarget);

        searchResults = uniqueArray.length;
        $("#total-results").html(searchResults + " results returned");
      }

      let features;

      function addPolygons(
        polygonGeometries,
        graphicsLayer,
        ClickEvent,
        tableSearch
      ) {
        let owner;
        let count;
        
        if (polygonGeometries.features.length > 0) {
         owner = polygonGeometries.features[0].attributes.Owner;
        }

        if (owner == "RESIDENT" && (!ClickEvent)) {
          return 
        } else {

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

            if (polygonGraphics.length === 1) {
              polygonGraphics.splice(0, 1);
            } else {
              polygonGraphics.splice(graphicIndex, 1);
            }

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
            //view.goTo(polygonGraphics);
          } else {
            graphicsLayer.addMany(polygonGraphics2)
           
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

            view.goTo({
              target: polygonGraphics,
              zoom: 18,
              // extent: newExtent,
            });
          } else {
            let graphic3;
            regSearch = true;
            // regular search polygons added here
            features
              .map(function (feature) {
                bufferGraphicId = feature.attributes.OBJECTID;
                if (!feature.geometry || tableSearch) {
                  return null; // Skip this feature as it has no geometry
                }
                graphic3 = new Graphic({
                  geometry: feature.geometry,
                  symbol: fillSymbol,
                  id: bufferGraphicId,
                });
                polygonGraphics2.push(graphic3);
              })
              .filter((graphic) => graphic !== null);

            if (polygonGraphics2.length == 1) {
              graphicsLayer.addMany(polygonGraphics2);

              let geometry = features[0].geometry;
              const geometryExtent = geometry.extent;
              const center = geometryExtent.center;
              const zoomOutFactor = 2.0; // Adjust as needed
              const newExtent = geometryExtent.expand(zoomOutFactor);

              view.goTo({
                target: polygonGraphics2,
                // zoom: 11,
                extent: newExtent,
              });
            } else {
              graphicsLayer.addMany(polygonGraphics2);
              if (polygonGraphics2.length > 0) {
                // Step 1: Extract extents of all polygon graphics
                const extents = polygonGraphics2.map(graphic => graphic.geometry.extent);
              
                // Step 2: Combine all extents into a single full extent
                const fullExtent = extents.reduce((acc, extent) => acc.union(extent), extents[0]);
              
                // Step 3: Expand the full extent by the zoom-out factor
                const zoomOutFactor = 3.0; // Adjust as needed
                const newExtent = fullExtent.expand(zoomOutFactor);
              
                // Step 4: Zoom the view to the expanded extent
                view.goTo({
                  target: newExtent
                }).catch(err => {
                  console.error("Error zooming to extent:", err);
                });
              } else {
                console.warn("No graphics available to calculate extent.");
              }
              
            }
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
      }
      }

      function processFeatures(features, polygonGraphics, e, silentMode) {
        let pointGraphic;
        let pointLocation;
        let pointGisLink;
        let clickEvent = false;

        function createList(features) {
          features.forEach(function (feature) {
            // PUT BACK TO FILTER OUT EMPTY OWNERS
            if ((feature.attributes.Owner === "" || null || undefined || feature.attributes.Owner === "RESIDENT") && !lasso && !clickEvent) {
              return;
            } else {
                buildParcelList(feature)
            }
          });
        }

        if (e && e != undefined && features[0]) {
          clickEvent = true
          pointGraphic = features[0].attributes.OBJECTID;
          pointLocation = features[0].attributes.Location;
          pointGisLink = features[0].attributes.GIS_LINK;

          const count = firstList.filter(
            (g) => g.objectid === pointGraphic
          ).length;

          const countGisLinks = firstList.filter(
            (g) => g.GIS_LINK === pointGisLink
          ).length;

          if (count >= 1 || (count == 0 && countGisLinks >= 1)) {
            createList(features);
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
            // if (!lasso) {
            //   features = features.filter(
            //     (item) => item.attributes.ACCOUNT_TYPE != "CONDOMAIN"
            //   );
            // }
            createList(features);
          } else {
            createList(features);
          }
        }

        if (e) {
          return;
        } else {
          // this logic needs to be sorted, no condos are searched on here
          // where no geom on condos are building results panel and passing in undefined values
          // only features is not empty

          // triggerfromNoCondos = true;

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

      function triggerDetailsZoom(results, main,) {
        view.graphics.removeAll(polygonGraphics);
        let parcelGeometry = results[0].geometry;
        let GIS_LINK = results[0].attributes.GIS_LINK;
        triggeredDetailsZoom = true

        if (parcelGeometry) {
          targetExtent = parcelGeometry;
          detailsGeometry = parcelGeometry;

          const geometryExtent = targetExtent.extent;
          const zoomOutFactor = 2.0;
          const newExtent = geometryExtent.expand(zoomOutFactor);

            const fillSymbol = {
              type: "simple-fill",
              color: [0, 0, 0, 0.1],
              outline: {
                color: [145, 199, 61, 1],
                width: 4,
              },
            };

            const polygonGraphic = new Graphic({
              geometry: parcelGeometry,
              symbol: fillSymbol,
              // id: bufferGraphicId,
            });
            view.graphics.addMany([polygonGraphic]);
          if (!zoomToDetails) {
            return
          } else {
            view
            .goTo({
              target: parcelGeometry,
              extent: newExtent,
              //  zoom: 15,
            })
              .catch(function (error) {
                if (error.name != "AbortError") {
                  console.error(error);
                  // NoZoomDetails = true;
                }
              });
          }
        } else {
          // for condos with no footprints
              let whereClause = `GIS_LINK = '${GIS_LINK}'`;
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
  
                const geometryExtent = targetExtent.extent;
                const zoomOutFactor = 2.0;
                const newExtent = geometryExtent.expand(zoomOutFactor);

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
  
                if (!zoomToDetails) {
                  return 
                } else {
                  view
                  .goTo({
                    target: geometry,
                    extent: newExtent,
                    // zoom: 15,
                  })
                  .catch(function (error) {
                    if (error.name != "AbortError") {
                      console.error(error);
                      // NoZoomDetails = true;
                    }
                  });
                }
            });
          }
      }

        function triggerListGroup(results, main, searchTerm) {
        let items = results;
        let condoMain = main;
      
        if (items.length <= 0) {
          clearContents();
          alert("Search resulted in an error, please try again.");
          return;
        }
      
        let itemId = items[0].attributes.Uniqueid;
        let objectID = items[0].attributes.OBJECTID;
      
        triggerDetailsZoom(items, condoMain);

        urlBackButton = true;
        triggerfromNoCondos = false;
        urlSearchUniqueId = false;

        $(".spinner-container").hide();
      }

      function buildLayerQuery() {
        let query2;

        if (sessionStorage.getItem("condos") === "no") {
          query2 = noCondosLayer.createQuery();
          query2.where = "1=1"
          query2.returnDistinctValues = false;
          query2.returnGeometry = true;
          query2.outFields = ["*"];
        } else {
          query2 = CondosLayer.createQuery();
          query2.where = "1=1";
          query2.returnDistinctValues = false;
          query2.returnGeometry = true;
          query2.outFields = ["*"];
        }
        return query2
      }

      function queryRelatedFeatureRecords(searchTerm, urlSearch, filterQuery) {
        if (sessionStorage.getItem("condos") === "no") {
          noCondosLayer.visible = true;
        } else {
          CondosLayer.visible = true;
        }

        $(".spinner-container").show();

        let whereClause;

        whereClause = `
          Street_Name LIKE '%${searchTerm}%' OR 
          MBL LIKE '%${searchTerm}%' OR 
          Location LIKE '%${searchTerm}%' OR 
          Co_Owner LIKE '%${searchTerm}%' OR 
          Uniqueid LIKE '%${searchTerm}%' OR 
          Owner LIKE '%${searchTerm}%' OR 
          GIS_LINK LIKE '%${searchTerm}%'
      `;

        let query;
        let triggerUrl;

        if (filterQuery) {
          query = filterQuery;
        } else if (urlSearchUniqueId) {
          query = filterQuery;
          tableSearch = true;
        } 


        if (sessionStorage.getItem("condos") === "no") {
          noCondosLayer.queryFeatures(query).then(function (result) {
            triggerUrl = result.features;
            if (result.features.length >= 0) {
              // THIS LOGIC RUNS WHERE THERES A CONDO MAIN BUT NO FOOTPRINTS
              // queries layer, no data, queries table to get gis_link
              // then gets condo main from layer with gis_link
              triggerUrl = result.features;
              noCondosParcelGeom = result.features;

              // if no condos and coming from url search of condiminium like wilton
              if (triggerfromNoCondos) {
                let triggerCondo = "";
                let triggerCondoMain = "";
                const firstQuery = noCondosTable.createQuery();
                firstQuery.where = query.where;
                firstQuery.returnGeometry = false;
                firstQuery.outFields = ["*"];

                noCondosTable
                  .queryFeatures(firstQuery)
                  .then(function (result) {
                    triggerCondo = result.features;
                    let data = result.features[0].attributes;
                    const gis_link = data.GIS_LINK;

                    let query2 = noCondosLayer.createQuery();
                    query2.where = `GIS_LINK = '${gis_link}'`;
                    query2.returnGeometry = true;
                    query2.returnHiddenFields = true; // Adjust based on your needs
                    query2.outFields = ["*"];

                    return noCondosLayer.queryFeatures(query2); // Return the promise to chain
                  })
                  .then(function (response) {
                    triggerUrl = response.features;
                    triggerCondoMain = response.features;
                    noCondosParcelGeom = response.features;
                    addPolygons(response, view.graphics, "");
                    processFeatures(response.features);
                    if (urlSearch) {
                      setTimeout(() => {
                        triggerListGroup(triggerCondo, triggerCondoMain, searchTerm);
                      }, 200)
                    }
                  })
                  .catch(function (error) {
                    console.error("Error querying features: ", error);
                  });
              } else {
                noCondosParcelGeom = result.features;
                addPolygons(result, view.graphics, "");
                processFeatures(result.features);
                if (urlSearch) {
                  setTimeout(() => {
                  triggerListGroup(triggerUrl, searchTerm);
                }, 200)
                }
                triggerfromNoCondos = false;
              }
            } else if (result.features.length === 1 && firstList.length > 2) {
              const firstQuery = noCondosTable.createQuery();
              firstQuery.where = whereClause;
              firstQuery.returnGeometry = false;
              firstQuery.outFields = ["*"];

              noCondosTable.queryFeatures(firstQuery).then(function (result) {
                addPolygons(result.features);
                processFeatures();
                if (urlSearch) {
                  setTimeout(() => {
                  triggerListGroup(triggerUrl, searchTerm);
                  }, 200)
                }
              });
            } else {
              const firstQuery = noCondosTable.createQuery();
              firstQuery.where = filterQuery.where;
              firstQuery.returnGeometry = false;
              firstQuery.outFields = ["*"];

              if (result.features.length == 0) {
                noCondosTable
                  .queryFeatures(firstQuery)
                  .then(function (result) {
                    triggerUrl = result.features;
                    GISLINK = result.features[0].attributes.GIS_LINK;
                    let uniId = result.features[0].attributes.Uniqueid;
                    noCondosParcelGeom = result.features;
                    addPolygons(result, view.graphics);
                    processFeatures(result.features);
                    if (urlSearch) {
                      setTimeout(() => {
                      needToSearchGisLink = true;
                      triggerListGroup(triggerUrl, uniId);
                      }, 200)
                    }
                  })
              }
            }
          });
          // classic search on condos layer
        } else {
          CondosLayer.queryFeatures(query).then(function (result) {
            triggerUrl = result.features;
            // dont add polygons if not geometry 
            if (result.features.length > 0) {
              const getId = result.features[0].attributes.Uniqueid;
                addPolygons(result, view.graphics, "");
                if (urlSearch) {
                  setTimeout(() => {
                  triggerListGroup(triggerUrl, getId);
                  }, 200)
                }
            }

            processFeatures(result.features);
          
          });
        }
      }

      const runQuery = (filterQuery) => {
        firstList = [];
        $("#suggestions").val('').html('')
        let features;
        let searchTerm = runQuerySearchTerm;


        // if (clickedToggle) {
        //   runQuerySearchTerm = e.replace(/&amp;/g, "&");
        // }

        if (
          (searchTerm?.length < 3 || !searchTerm) &&
          !urlSearchUniqueId) {
          clearContents();
          return;
        } else {
          let query;
          if (urlSearchUniqueId) {
            query = filterQuery; // coming from url unique id search
          } else {
            query = CondosTable.createQuery();
            query.where = `
              Street_Name LIKE '%${searchTerm}%' OR 
              MBL LIKE '%${searchTerm}%' OR 
              Location LIKE '%${searchTerm}%' OR 
              Co_Owner LIKE '%${searchTerm}%' OR 
              Uniqueid LIKE '%${searchTerm}%' OR 
              Owner LIKE '%${searchTerm}%' OR
              GIS_LINK LIKE '%${searchTerm}%'
            `;
            query.returnGeometry = false;
            query.returnHiddenFields = true; // Adjust based on your needs
            query.outFields = ["*"];
          }
          CondosTable.queryFeatures(query)
            .then((response) => {
              if (response.features.length > 0) {
                features = response.features;
                if (
                  response.features[0].attributes.Match_Status === "MISMATCH" &&
                  response.features[0].attributes.Parcel_Type ===
                    "Condominium"
                ) {
                  triggerfromNoCondos = true;
                }
                
                features.forEach(function (feature) {
                  const residentCheck = CheckResident(searchTerm, feature)
                  if (feature.attributes.Owner === "" || null || undefined || feature.attributes.Owner === "RESIDENT" && !residentCheck) {
                    return;
                  } else { 
                    buildParcelList(feature)
                  }
                });

              let layerQuery = buildLayerQuery()

              let tableSearch = null;

                if (urlSearchUniqueId) {
                  layerQuery.where = filterQuery.where;
                  tableSearch = true;
                }

              const tableQuery = buildFilterQuery(query)
              queryRelatedFeatureRecords(runQuerySearchTerm, tableSearch, tableQuery);
              }
            })
            .catch((error) => {
              console.error("Error querying for details:", error);
            });
        }
      };

      function buildSuggestions(searchTerm) {
          const searchFields = [
            "Street_Name",
            "MBL",
            "Location",
            "Co_Owner",
            "Uniqueid",
            "Owner",
            "GIS_LINK",
          ];

          $("#searchInput ul").remove();
          $("#suggestions").hide();
          $("#dropdown").show();
      
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
          query.outFields = searchFields;
          let uniqueSuggestions = new Set();

          noCondosTable.queryFeatures(query).then((response) => {
            let suggestionsContainer = document.getElementById("suggestions");
            suggestionsContainer.innerHTML = "";
            response.features.forEach((feature) => {
              searchFields.forEach((fieldName) => {
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

                  uniqueSuggestions.add(value);
                  suggestionsContainer.style.display = "block";

                  suggestionDiv.addEventListener("click", function (e) {
                    clickedToggle = true;
                    let value = e.target.textContent

                    if (clickedToggle) {
                      runQuerySearchTerm = value.replace(/&amp;/g, "&");
                      runQuery();
                    }
                 
                    clickedToggle = false;
                  });
                }
              });
            });
          });
      }

       function clearContents(e, string) {
        const currentUrl = window.location.href;
        const newUrl = removeQueryParam("uniqueid", currentUrl);
        window.history.pushState({ path: newUrl }, "", newUrl);

        if (sessionStorage.getItem("condos") === "no") {
          noCondosLayer.visible = true;
        } else {
          CondosLayer.visible = true;
        }
        // global search
        runQuerySearchTerm = "";
        $("#searchInput ul").remove();
        $("#searchInput").val = "";
        $("#results").empty();
        $("#total-results").html("No Parcels Selected");

      
        const searchInput = document.getElementById("searchInput");
        searchInput.value = "";
        searchTerm = "";
        firstList = [];
        secondList = [];
        zoomToObjectID = "";
        urlSearchUniqueId = false;
        triggerfromNoCondos = false;
        zoomToDetails = true;
        triggeredDetailsZoom = false;
        $(".spinner-container").hide();
        $("#dropdown").hide();
        $("#suggestions").hide();

   
        closeContent()

        let suggestionsContainer = document.getElementById("suggestions");
        suggestionsContainer.innerHTML = "";
        view.graphics.removeAll();
        polygonGraphics = [];
      }

      document
        .getElementById("searchInput")
        .addEventListener("input", function (e) {
          e.preventDefault();
          firstList = [];
          secondList = [];
          polygonGraphics = [];
          view.graphics.removeAll();
          $("#suggestions").html('')
        
          runQuerySearchTerm = e.target.value
            .toUpperCase()
            .replace(/&amp;/g, "&");

          if (runQuerySearchTerm.length > 1 ) {
              buildSuggestions(runQuerySearchTerm)
          } else {
            $("#suggestions").hide()
          }
        
        });

      document.addEventListener("click", function (e) {
        if (e.target.id !== "searchInput") {
          document.getElementById("suggestions").style.display = "none";
        }
      });

      clearBtn.addEventListener("click", function () {
        clearContents();
      });

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
      const uniqueId = params.uniqueid;
      let whereClause = `Uniqueid = '${uniqueId}'`; // Ensure this key matches your URL parameter

      if (uniqueId) {
        urlSearchUniqueId = true;

        view
          .when(function () {
            function checkQueryVal() {
              query = CondosTable.createQuery();
              query.where = whereClause;
              query.returnGeometry = false;
              query.returnHiddenFields = true; // Adjust based on your needs
              query.outFields = ["*"];

              noCondosTable.queryFeatures(query).then((response) => {
                let data = response.features[0].attributes;
                let type = data.Building_Type;
                let misMatch = data.Match_Status;

                if (misMatch === "MISMATCH" && type === "Condominium") {
                  triggerfromNoCondos = true;
                }
                runQuery(query);
              });
            }

            query = CondosTable.createQuery();
            query.where = whereClause;
            query.returnGeometry = false;
            query.returnHiddenFields = true; // Adjust based on your needs
            query.outFields = ["*"];

            checkQueryVal();
          })
          .catch(function (error) {
            console.error("Error occurred while the view was loading: ", error);
          });
      }

       function hitQuery() {
        if (sessionStorage.getItem("condos") === "no") {
          noCondosLayer.visible = true;
        } else {
          CondosLayer.visible = true;
        }

        $("dropdown").empty();
        $("#total-results").show();
        $("#ResultDiv").hide();
        polygonGraphics = [];
        view.graphics.removeAll();
        runQuery();
      }

      let debounceTimer2;

      document
        .getElementById("searchButton")
        .addEventListener("click", function (event) {
          event.preventDefault();

          function throttleQuery() {
            clearTimeout(debounceTimer2);
            debounceTimer2 = setTimeout(() => {
              hitQuery();
            }, 300);
          }
          throttleQuery();
        });

           let lastTarget = null;

  function closeContent() {
      $("#closed").show();
      $("#open").hide();
      $(".content").hide();
      $(".content > div").hide();
      lastTarget = null;
  }

  function toggleContent(target) {
    if (lastTarget === target && $(target).is(":visible")) {
      $("#closed").show();
      $("#open").hide();
      $(".content").hide();
      $(".content > div").hide();
      lastTarget = null;
    } else {
      $("#open").show();
      $("#closed").hide();
      $(".content").show();
      $(".content > div").hide();
      $(target).show();
      lastTarget = target;
    }
  }

  $(".action-btn").click(function () {
    const target = $(this).data("target");
    if (target == '.help' || target == '.report') {
      return
    } else {
      toggleContent(target);
    }

  });

  $("#action-exp").click(function () {
    // If lastTarget is already open, close it; otherwise, reopen it
    if (lastTarget) {
      toggleContent(lastTarget);
    } else {
   
      const defaultTarget = $(".action-btn").first().data("target");
      toggleContent(defaultTarget);
    }
  });
  


    });
})
