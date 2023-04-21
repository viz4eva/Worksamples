import { Delaunay } from "https://cdn.skypack.dev/d3-delaunay@6";


/*Read csv file*/
d3.csv("media_items.csv").then(function (data) {


    //compute needed data

    //getting nodes
    let nodes = [];
    let dataArr = Array.from(data);
    //limit amount of media items to 600
    dataArr = dataArr.slice(1400, 2000);

    dataArr.forEach(element => {
        //filter out items without keywords and unrealistic duration
        if (element.keywords != "" && element.duration <= 10000) {
            nodes.push(element)
        }
    });



    //getting links -> do media items share keywords?
    let links = [];
    nodes.forEach(element1 => {

        nodes.forEach(element2 => {
            if (element1.mediaid != element2.mediaid) {
                let count = 0;
                let commonKeywords = [];

                //get keywords 
                let keywords = element1.keywords.split(", ");

                keywords.forEach(keyword => {

                    if (element2.keywords.includes(keyword) && keyword !== "") {
                        count++;
                        commonKeywords.push(keyword);
                    }

                })

                //only links with heavier weights are taken into account
                if (count >= 2) {
                    links.push({
                        source: element1,
                        target: element2,
                        weight: count,
                        common: commonKeywords
                    })

                }


            }


        })
    })



    //get clusters of very similar media items
    let clusters = [];
    links.forEach(link => {
        //cluster computation --> if there are at least three common keywords
        if (link.weight >= 3) {

            let found = false;
            clusters.forEach(cluster => {
                //cluster sizes are limited to achieve higher diversity of clusters
                if (cluster.members.includes(link.source) && cluster.size < 600) {
                    found = true;
                    cluster.members.push(link.target);
                    cluster.size++;
                    cluster.links.push(link);
                    cluster.commonKeywords = link.common;
                }
                else if (cluster.members.includes(link.target) && cluster.size < 600) {
                    found = true;
                    cluster.members.push(link.source);
                    cluster.size++;
                    cluster.links.push(link);
                    cluster.commonKeywords = link.common;
                }
            })

            if (!found) {
                clusters.push({
                    members: [link.source, link.target],
                    size: 2,
                    links: [link],
                    commonKeywords: link.common,
                    id: Math.random()
                })
            }

        }
    })



    //build data structure for graph 
    var graph = { nodes: nodes, links: links };


    //define scales to map data properties to graphics later
    var linkColor = d3.scaleLinear()
        .domain([0, 5])
        .range(["#ccc", "#111"]);

    var linkWidth = d3.scaleLinear()
        .domain([3, 30])
        .range([1, 4]);

    var nodeColor = d3.scaleOrdinal()
        .range(d3.schemeCategory10);

    let minSize = d3.min(graph.nodes.map(d => d.duration));
    let maxSize = d3.max(graph.nodes.map(d => d.duration));
    var nodeSize = d3.scaleSqrt()
        .domain([minSize, maxSize])
        .range([2, 6]);



    //build graph with physics simulation 
    var svg = d3.select("svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height")


    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function (d) {
            return d.id;
        }))
        .force("charge", d3.forceManyBody().strength(-290).distanceMax(48).distanceMin(2))
        .force("center", d3.forceCenter(width / 2 + 30, height / 2))
        .force("collide", d3.forceCollide(7));

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    let graphSVG = svg.append("g")
        .attr("id", "graph");

    //add zoom functionality
    var zoom = d3.zoom()
        .scaleExtent([0.9, 3])
        .on('zoom', function () {
            graphSVG.attr('transform', d3.event.transform);
        })

    svg.call(zoom);

    //adjust data-driven appearance of nodes and links
    //adjusting shown links --> here all links are shown
    let shownLinks = graph.links.filter(link => link.weight >= 2)
    var link = graphSVG.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(shownLinks)
        .enter().append("line")
        .attr("stroke", d => linkColor(d.weight))
        .attr("stroke-width", d => linkWidth(d.weight))
        .attr("opacity", 0.3);

    var node = graphSVG.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("r", d => nodeSize(d.duration))
        .attr("fill", d => nodeColor(d.mediatype))
        .attr("opacity", 0.8)
        .attr("cursor", "pointer")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("click", showItemDetails);

    node.append("title")
        .text(function (d) {
            return d.title;
        });

    const hulls = graphSVG.append("g")
        .attr("id", "hulls");



    //add functionality to hull button
    const btn = document.querySelector("#hullButton");
    btn.addEventListener("click", showHulls);



    //add Legends
    svg.append("g")
        .attr("class", "legendSize")
        .attr("transform", "translate(20, 20)");

    var legendSize = d3.legendSize()
        .scale(nodeSize)
        .shape('circle')
        .shapePadding(10)
        .labelOffset(10)
        .cells([60, 300, 600, 1200, 3000, 5000])
        .orient('vertical')
        .title("Duration of media item in seconds");

    svg.select(".legendSize")
        .call(legendSize);


    svg.append("g")
        .attr("class", "legendColors")
        .attr("transform", "translate(20,240)");

    var legendColors = d3.legendColor()
        .shapeWidth(50)
        .cells(5)
        .orient("horizontal")
        .scale(nodeColor)
        .title("Media Types");

    svg.select(".legendColors")
        .call(legendColors);


    //functions for interactivity

    function ticked() {
        link
            .attr("x1", function (d) {
                return d.source.x;
            })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });

        node
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            });
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    //detail info about media items are displayed when graph nodes are clicked
    function showItemDetails(event, d) {
        //"deselect" currently selected nodes
        d3.select(".markedNode")
            .attr("class", "defaultNode");

        d3.select(this)
            .attr("class", "markedNode");

        //get currently selected data point
        let current = graph.nodes[d];

        //empty detail section 
        document.querySelector("#selection_details").innerHTML = "<div id=\"title\"></div>" +
            "<div id=\"image\"></div>" +
            "<div id=\"additionalInfo\"></div>" +
            "<div id=\"description\"></div>";

        //fill with info on currently selected item
        document.querySelector("#title").innerHTML = current.title + "<br\><br\>";
        document.querySelector("#description").innerHTML = current.description;
        document.querySelector("#image").innerHTML = "<img src=\"" + current.thumbnailurl + "\">";

        document.querySelector("#additionalInfo").innerHTML =
            "<br\><br\><button onclick=\"window.location.href='" + current.playurl + "';\">View Ressource</button> <br\><br\>" +
            "<span class=\"pre\">Media type:</span> " + current.mediatype + "  <br\>" +
            `<span class=\"pre\">Duration:</span> ${Math.floor(parseInt(current.duration) / 60)}:${parseInt(current.duration) - Math.floor(current.duration / 60) * 60} ` + " <br\>" +
            "<span class=\"pre\">Language:</span> " + current.language + "  <br\>" +
            "<span class=\"pre\">Associated Keywords:</span> " + current.keywords;


    }

    //display convex hulls to visualize clusters when button is clicked
    function showHulls() {

        //compute convex hulls for found clusters
        let hulls = [];
        clusters.forEach(cluster => {
            let points = cluster.members.map(member => {
                return [member.x, member.y]
            })

            let delaunay = Delaunay.from(points);
            const hull = delaunay.renderHull();
            hulls.push({
                hullpath: hull,
                hullID: Math.random()
            });



        })

        //adjust visual appearance of clusters
        let hullColors = d3.scaleOrdinal()
            .range(d3.schemeCategory10);

        d3.select("#hulls").selectAll("path")
            .data(hulls).enter()
            .append("path")
            .attr("d", d => d.hullpath)
            .attr("fill", d => hullColors(d.hullID))
            .attr("opacity", 0.2)
            .attr("stroke", "black")
            .attr("cursor", "pointer")
            .attr("stroke-linejoin", "round")
            .on("mouseover", showClusterDetails)


        //adjust active buttons
        document.querySelector("#hullButtonReset").disabled = false;
        document.querySelector("#hullButton").disabled = true;

        const btnReset = document.querySelector("#hullButtonReset");
        btnReset.addEventListener("click", reset);
    }

    //display details about cluster that is hovered over
    function showClusterDetails(event, d) {
        document.querySelector("#keyword_field").innerHTML = "";

        let current = clusters[d];

        let detailBox = d3.select("#keyword_field")
            .append("ol")
            .attr("id", "keywordList");

        let keywordList = current.commonKeywords;

        for (let index = 0; index < keywordList.length; index++) {
            d3.select("#keywordList").append("li")
                .text(keywordList[index]);
        }

        detailBox.append("p").append("ul")
            .attr("id", "associatedList");

        
        let associatedList = current.members;

        for (let index = 0; index < associatedList.length; index++) {
            d3.select("#associatedList").append("li")
                .text(associatedList[index].title);
        }



    }

    //hide cluster visualization
    function reset() {
        document.querySelector("#hulls").innerHTML = "";
        if (document.querySelector("#keywordList") != null) {
            document.querySelector("#keywordList").innerHTML = "";
        }


        //adjust button activity
        document.querySelector("#hullButton").disabled = false;
        document.querySelector("#hullButtonReset").disabled = true;
    }
})
