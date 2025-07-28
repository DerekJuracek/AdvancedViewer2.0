require([
  "esri/WebMap",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/core/reactiveUtils",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/widgets/BasemapLayerList",
  "esri/widgets/Legend",

], function (
  WebMap,
  MapView,
  FeatureLayer,
  reactiveUtils,
  Graphic,
  GraphicsLayer,
  BasemapLayerList,
  Legend,
) {
  const urlParams = new URLSearchParams(window.location.search);
  let currentURL = window.location.href;
  let configUrl = urlParams.get("viewer");

  const configFiles = [
    "colebrookct",
    "columbiact",
    "durhamct",
    "franklinct",
    "haddamct",
    "northcanaanct",
    "roxburyct",
    "roxburyctassessor",
    "scotlandct",
    "warrenct",
    "warrenctassessor",
    "washingtonct",
    "wiltonct",
    "wolcottct",
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
      configVars.zoom = config.zoom;
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

      const CondosTable = new FeatureLayer({
        url: `${configVars.masterTable}`,
      });

       const noCondosTable = new FeatureLayer({
        url: `${configVars.masterTable}`,
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
          console.log('serach on resident not clicking')
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
        // if (clickHandle) {
        //   clickHandle?.remove();
        //   clickHandle = null;
        // }
        // if (DetailsHandle) {
        //   DetailsHandle?.remove();
        //   DetailsHandle = null;
        // }

        // if (lassoGisLinks) {
        //   $("#select-button").addClass("btn-warning");
        //   clickHandle = view.on("click", handleClick);
        // } else {
        //   DetailsHandle = view.on("click", handleDetailsClick);
        //   $("#select-button").removeClass("btn-warning");
        // }

       
      }

      const runQuery = () => {
        firstList = [];
        $("#suggestions").val('').html('')
        let features;
        let searchTerm = runQuerySearchTerm;

        if (searchTerm?.length < 3 && !searchTerm) {
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

              

                let tableSearch = null;

                if (urlSearchUniqueId) {
                  tableQuery.where = filterQuery.where;
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
                    runQuery(e.target.innerHTML);
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

        // Get a reference to the search input field
        const searchInput = document.getElementById("searchInput");
        searchInput.value = "";
        searchTerm = "";
        firstList = [];
        secondList = [];
        zoomToObjectID = "";
        urlSearchUniqueId = false;
        triggerfromNoCondos = false;
        $(".spinner-container").hide();
        $("#dropdown").hide();

        urlBackButton = false;

        let suggestionsContainer = document.getElementById("suggestions");
        suggestionsContainer.innerHTML = "";
        view.graphics.removeAll();
        polygonGraphics = [];
      }

      document
        .getElementById("searchInput")
        .addEventListener("input", function (e) {
          firstList = [];
          secondList = [];
          polygonGraphics = [];
          view.graphics.removeAll();
          $("#suggestions").html('')
          runQuerySearchTerm = e.target.value
            .toUpperCase()
            .replace(/&amp;/g, "&");
          buildSuggestions(runQuerySearchTerm)
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

      document
        .getElementById("searchButton")
        .addEventListener("click", function (event) {
          event.preventDefault();
          $("#results-div").css("left", "0px");
          function throttleQuery() {
            clearTimeout(debounceTimer2);
            debounceTimer2 = setTimeout(() => {
              hitQuery();
            }, 300);
          }
          throttleQuery();
        });


    });
})