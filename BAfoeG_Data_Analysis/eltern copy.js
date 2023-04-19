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

        const fathers = data.slice(0, 6);
        const mothers = data.slice(6);

        console.log(fathers);
        console.log(mothers);

        let width = 700,
            height = 500,
            gap = 50;


        const svg = d3.select("svg")
            .attr("width", width)
            .attr("height", height);



        //horizontale Linien
        svg.append("g").attr("class","horLines")
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
        const radiusScale = d3.scaleSqrt()
            .domain([d3.min(data, d => d["value"]), d3.max(data, d => d["value"])])
            .range([width / 100, width / 30])

        svg.append("g").attr("class","fatherCircles")
            .selectAll("circle")
            .data(fathers)
            .enter()
            .append("circle")
            .attr("fill", "blue")
            .attr("r", d => radiusScale(d.value))
            .attr("cx", width / 4 + 60)
            .attr("cy", (d, i) => { return i * height / 10 + gap })

        svg.append("g").selectAll("text")
            .data(fathers)
            .enter()
            .append("text")
            .attr("x", width / 2 - 60 )
            .attr("y", (d, i) => { return i * height / 10 + gap })
            .text(d => d.value);

        svg.append("g").attr("class","motherCircles")
            .selectAll("circle")
            .data(mothers)
            .enter()
            .append("circle")
            .attr("fill", "red")
            .attr("r", d => radiusScale(d.value))
            .attr("cx", 3 * width / 4 - 60)
            .attr("cy", (d, i) => { return i * height / 10 + gap });
        
            svg.append("g").selectAll("text")
            .data(mothers)
            .enter()
            .append("text")
            .attr("x", width / 2 + 30)
            .attr("y", (d, i) => { return i * height / 10 + gap })
            .text(d => d.value);

        //vertikale Linie
        svg.append("line")
            .attr("x1", width / 2)
            .attr("x2", width / 2)
            .attr("y1", 50)
            .attr("y2", fathers.length * gap + height / 10)
            .attr("stroke", "black")


        //Textlabels Kategorien
        const labels = ["Berufstätig insgesamt", "Davon Arbeiter:in", "Davon Angestellte:r", "Davon Beamt:in", "Davon Selbstständige:r", "Nicht berufstätig"]
        svg.append("g").attr("class","categoryLabels")
            .selectAll("text")
            .data(labels)
            .enter()
            .append("text")
            .attr("y", (d, i) => { return i * height / 10 + gap + 3 })
            .attr("x", width / 4 - 120)
            .text(d => d);

        svg.append("text")
            .attr("y", 22)
            .attr("x", width / 4 + 40)
            .text("Väter");

        svg.append("text")
            .attr("y", 22)
            .attr("x", 3 * width / 4 - 80)
            .text("Mütter");



    })