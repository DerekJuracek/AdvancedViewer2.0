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
          // if (clickHandle) {
          //   clickHandle?.remove();
          //   clickHandle = null;
          // }

          // if (DetailsHandle) {
          //   DetailsHandle?.remove();
          //   DetailsHandle = null;
          // }
          $("#select-button").attr("title", "Select Enabled");
          let targetElement = event.target.closest("li");
          if (!targetElement) return;

          // Now you can handle the click event as you would in the individual event listener
          let itemId = targetElement.getAttribute("data-id");
          let objectID = targetElement.getAttribute("object-id");
          zoomToFeature(objectID,  itemId);
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
          if (event.target.closest(".no-zoomto")) {
            console.log("dont zoom");
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
            <div class="justZoomBtn"><button type="button" class="btn btn-primary btn-sm justZoom" title="Zoom to Parcel"><calcite-icon icon="magnifying-glass-plus" scale="s"/>Zoom</button><button type="button" class="btn btn-primary btn-sm justRemove" title="Remove from Search List"><calcite-icon icon="minus-circle" scale="s"/>Remove</button></div>`;
          } else if (!locationGeom) {
            listItemHTML = ` <div class="listText noGeometry">UID: ${locationUniqueId}  &nbsp;<br>MBL: ${locationMBL} <br> ${locationOwner} ${locationCoOwner} <br> ${locationVal} <br> Property Type: ${propertyType} 
             </div><div class="justZoomBtn"><button type="button" class="btn btn-primary btn-sm justRemove" title="Remove from Search List"><calcite-icon icon="minus-circle" scale="s"/>Remove</button></div>`;
            listItem.classList.add("no-zoomto");
          } else {
            listItemHTML = ` <div class="listText">UID: ${locationUniqueId}  &nbsp;<br>MBL: ${locationMBL} <br> ${locationOwner} ${locationCoOwner} <br> ${locationVal} <br> Property Type: ${propertyType}</div>
            <div class="justZoomBtn"><button type="button" class="btn btn-primary btn-sm justZoom" title="Zoom to Parcel"><calcite-icon icon="magnifying-glass-plus" scale="s"/>Zoom</button><button type="button" class="btn btn-primary btn-sm justRemove" title="Remove from Search List"><calcite-icon icon="minus-circle" scale="s"/>Remove</button></div>`;
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

        if (e && e != undefined) {
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
        console.log(searchTerm)

        if (searchTerm?.length < 3 || !searchTerm) {
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
        $("#suggestions").hide();

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