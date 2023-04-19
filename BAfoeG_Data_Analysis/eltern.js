d3.csv("elternData.csv")
    .then(function (parents) {

        const categories = Object.keys(parents[0]).toString().replaceAll("\"", "").split(",");
        const values = Object.values(parents[0]).toString().replaceAll("\"", "").split(",");

        const data = [];
        for (let i = 0; i < categories.length; i++) {
            let obj = {
                category: categories[i],
                value: parseInt(values[i])
            }
            data.push(obj);
        }

        const fathersRaw = data.slice(0, 6);
        const mothersRaw = data.slice(6);

        console.log(fathersRaw);
        console.log(mothersRaw);

        let index = 5;

        const fathers = [fathersRaw[index], ...fathersRaw.filter((_, i) => i !== index)]
        const mothers = [mothersRaw[index], ...mothersRaw.filter((_, i) => i !== index)]



        console.log(fathers);
        console.log(mothers);

        let width = 800,
            height = 500,
            gap = 50;


        const svg = d3.select("svg")
            .attr("width", width)
            .attr("height", height);

        const graphics = svg.append("g")
            .attr("id", "graphics")
            .attr("transform", "translate(120 0)");



        //horizontale Linien
        graphics.append("g").attr("class", "horLines")
            .selectAll("line")
            .data(fathers)
            .enter()
            .append("line")
            .attr("x1", width / 4 + 60)
            .attr("x2", 3 * width / 4 - 60)
            .attr("y1", (d, i) => { return i * height / 10 + gap })
            .attr("y2", (d, i) => { return i * height / 10 + gap })
            .attr("stroke", "black");

        //Kreise für Mütter und Väter
        const totalScale = d3.scaleLinear()
            .domain([0, data[0].value + data[data.length - 1].value])
            .range([5, 200])

        const partialScale = d3.scaleLinear()
            .domain([d3.min(data.slice(1, data.length - 1), d => d["value"]), d3.max(data.slice(1, data.length - 1), d => d["value"])])
            .range([0, totalScale(data[0].value)])

        graphics.append("g").attr("class", "fatherCircles")
            .selectAll("rect")
            .data(fathers)
            .enter()
            .append("rect")
            .attr("fill", "#6699ff")
            .attr("width", d => totalScale(d.value))
            .attr("height", height / 20)
            .attr("x", width / 4 + 60)
            .attr("y", (d, i) => { return i * height / 10 + gap - 13 })
            .attr("transform", (d) => { return `translate (-${totalScale(d.value)} 0)` })
            .append("title").text((d) => d.value.toLocaleString());


        graphics.append("g").attr("class", "motherCircles")
            .selectAll("rect")
            .data(mothers)
            .enter()
            .append("rect")
            .attr("fill", "#ff6666")
            .attr("width", d => totalScale(d.value))
            .attr("height", height / 20)
            .attr("x", 3 * width / 4 - 60)
            .attr("y", (d, i) => { return i * height / 10 + gap - 13 })
            .append("title").text((d) => d.value.toLocaleString());



        //vertikale Linie
        const xVerticalLine = width / 2;
        const yVerticalLine = fathers.length * gap + height / 5;
        graphics.append("line")
            .attr("x1", width / 2)
            .attr("x2", width / 2)
            .attr("y1", 50)
            .attr("y2", yVerticalLine)
            .attr("stroke", "black")


        //Textlabels Kategorien
        const labels = ["Nicht berufstätig", "Berufstätig insgesamt"]
        const sublabels = ["Davon Arbeiter:in", "Davon Angestellte:r", "Davon Beamt:in", "Davon Selbstständige:r"]

        svg.append("g").attr("class", "categoryLabels")
            .selectAll("text")
            .data(labels)
            .enter()
            .append("text")
            .attr("y", (d, i) => { return i * height / 10 + gap + 3 })
            .attr("x", gap)
            .text(d => d);

        svg.append("g").attr("class", "categorySubLabels")
            .selectAll("text")
            .data(sublabels)
            .enter()
            .append("text")
            .attr("y", (d, i) => { return i * height / 10 + gap * 3 + 3 })
            .attr("x", gap + 50)
            .text(d => d);

        graphics.append("text")
            .attr("y", 22)
            .attr("x", width / 4 + 40)
            .text("Väter");

        graphics.append("text")
            .attr("y", 22)
            .attr("x", 3 * width / 4 - 80)
            .text("Mütter");

        //add piechart
        const pieData = [178_361, 444_642]; //Source: https://www.govdata.de/web/guest/daten/-/details/bafog-geforderte-nach-wohnung-wahrend-der-ausbildung-umfang-der-forderung-bedarfssatzgruppen-un
        const sum = 178_36 + 444_642;

        const colorScale = d3.scaleOrdinal()
            .domain(pieData)
            .range(["#ffcc66", "#996600"]);

        const pie = d3.pie();
        graphics.append("g").attr("id", "piechart")
            .attr("transform", `translate(${xVerticalLine} ${yVerticalLine})`)
            .selectAll("g")
            .data(pie(pieData))
            .enter()
            .append("path")
            .attr("d", d3.arc().innerRadius(0).outerRadius(width / 20))
            .attr("fill", d => {
                return colorScale(d.index)
            });


        //Add annotation 
        svg.append("text")
            .attr("transform", `translate(${gap} ${height - 30} )`)
            .text("Unter 30% der Geförderten wohnten 2021 im Haushalt der Eltern");

        graphics.append("line")
            .attr("x1", xVerticalLine - 150)
            .attr("x2", xVerticalLine - width / 20)
            .attr("y1", height - gap)
            .attr("y2", yVerticalLine)
            .attr("stroke", "black")

    })