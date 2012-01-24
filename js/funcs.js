var proposalaccessallowed = false;
var apiurl = 'http://readidata.nitrd.gov/star/py/api.py/'; //_beta

var divisions = {
"OCI":"Office of Cyberinfrastructure",
"OGC":"Office of the General Counsel",
"OIA":"Office of Integrative Activities",
"OISE":"Office of International Science and Engineering",
"ODI":"Office of Diversity and Inclusion (ODI)",
"OLPA":"Office of Legislative & Public Affairs",
"OPP":"Office of Polar Programs",
"NSB":"Office of the Assistant Director",
"OIG":"Office of the Assistant Director",
"MCB":"Division of Molecular & Cellular Biosciences",
"DBI":"Division of Biological Infrastructure",
"IOS":"Division of Integrative Organismal Systems",
"DEB":"Division of Environmental Biology",
"EF":"Emerging Frontiers Office",
"CCF":"Division of Computing and Communication Foundations",
"CNS":"Division of Computer and Network Systems",
"IIS":"Division of Information and Intelligent Systems",
"DRL":"Division of Research on Learning in Formal and Informal Settings",
"DGE":"Division of Graduate Education",
"HRD":"Division of Human Resource Development",
"DUE":"Division of Undergraduate Education",
"CBET":"Division of Chemical, Bioengineering, Environmental, and Transport Systems",
"CMMI":"Division of Civil, Mechanical & Manufacturing Innovation",
"ECCS":"Division of Electrical, Communications & Cyber Systems",
"EEC":"Division of Engineering Education & Centers",
"EFRI":"Office of Emerging Frontiers in Research & Innovation",
"IIP":"Division of Industrial Innovation & Partnerships",
"ENG":"Office of the Assistant Director",
"AGS":"Division of Atmospheric and Geospace Sciences",
"EAR":"Division of Earth Sciences",
"OCE":"Division of Ocean Sciences",
"GEO":"Office of the Assistant Director",
"AST":"Division of Astronomical Sciences",
"CHE":"Division of Chemistry",
"DMR":"Division of Materials Research",
"DMS":"Division of Mathematical Sciences",
"PHY":"Division of Physics",
"MPS":"Office of the Assistant Director",
"SES":"Division of Social and Economic Sciences",
"BCS":"Division of Behavioral and Cognitive Sciences",
"NCSE":"National Center for Science and Engineering Statistics",
"SMA":"SBE Office of Multidisciplinary Activities",
"SBE":"Office of the Assistant Director",
"BD":"Budget Division",
"DACS":"Division of Acquisition and Cooperative Support",
"DFM":"Division of Financial Management",
"DGA":"Division of Grants & Agreements",
"DIAS":"Division of Institution and Award Support",
"HRM":"Division of Human Resource Management",
"DIS":"Division of Information Systems",
"DAS":"Division of Administrative Services",
"EPSCoR":"Office of Experimental Program To Stimulate Competitive Research",
"EPS":"Office of Experimental Program to Stimulate Competitive Research"
};

var directorates = {
"OCI":"Office of the Director",
"OGC":"Office of the Director",
"EPSCoR":"Office of Information & Resource Management",
"OISE":"Office of the Director",
"ODI":"Office of the Director",
"OLPA":"Office of the Director",
"OPP":"Office of the Director",
"NSB":"National Science Board",
"OIG":"Office of the Inspector General",
"MCB":"Directorate for Biological Sciences",
"DBI":"Directorate for Biological Sciences",
"IOS":"Directorate for Biological Sciences",
"DEB":"Directorate for Biological Sciences",
"EF":"Directorate for Biological Sciences",
"CCF":"Directorate for Computer & Information Science & Engineering",
"CNS":"Directorate for Computer & Information Science & Engineering",
"IIS":"Directorate for Computer & Information Science & Engineering",
"DRL":"Directorate for Education & Human Resources",
"DGE":"Directorate for Education & Human Resources",
"HRD":"Directorate for Education & Human Resources",
"DUE":"Directorate for Education & Human Resources",
"CBET":"Directorate for Engineering",
"CMMI":"Directorate for Engineering",
"ECCS":"Directorate for Engineering",
"EEC":"Directorate for Engineering",
"EFRI":"Directorate for Engineering",
"IIP":"Directorate for Engineering",
"AGS":"Directorate for Geosciences",
"EAR":"Directorate for Geosciences",
"OCE":"Directorate for Geosciences",
"AST":"Directorate for Mathematical & Physical Sciences",
"CHE":"Directorate for Mathematical & Physical Sciences",
"DMR":"Directorate for Mathematical & Physical Sciences",
"DMS":"Directorate for Mathematical & Physical Sciences",
"PHY":"Directorate for Mathematical & Physical Sciences",
"SES":"Directorate for Social, Behavioral & Economic Sciences",
"BCS":"Directorate for Social, Behavioral & Economic Sciences",
"NCSE":"Directorate for Social, Behavioral & Economic Sciences",
"SMA":"Directorate for Social, Behavioral & Economic Sciences",
"BD":"Office of Budget, Finance, and Award Management",
"DACS":"Office of Budget, Finance, and Award Management",
"DFM":"Office of Budget, Finance, and Award Management",
"DGA":"Office of Budget, Finance, and Award Management",
"DIAS":"Office of Budget, Finance, and Award Management",
"HRM":"Office of Information & Resource Management",
"DIS":"Office of Information & Resource Management",
"DAS":"Office of Information & Resource Management",
"ANT":"Directorate for Polar Research",
"ARC":"Directorate for Polar Research",
"PEHS":"Directorate for Polar Research",
"AIL":"Directorate for Polar Research",
"EPS":"Office of Information & Resource Management",
"OIA":"Office of the Director",
"ENG":"Directorate for Engineering",
"GEO":"Directorate for Geosciences",
"MPS":"Directorate for Mathematical & Physical Sciences",
"SBE":"Directorate for Social, Behavioral & Economic Sciences"
}

//globals
var legend_topics = {};

//global variable that holds selected topic data
//when user first selects a topic read the data and store it in this array (indexed by topic id)
//then use it to add/remove from the summary instead of retrieving it each time
var topicsummarydata_pge = [];
var topicsummarydata_org = [];
var topicsummarydata_year = [];

//global variable that holds selected proposal data
//when user first selects a proposal, researcher or org read the data and store it in this array (indexed by proposal id)
//then use it to add/remove from the summary instead of retrieving it each time
var propsummarydata = {};

$(document).ready(function() {

	//When page loads...
	//hide main content container
	$('#main').hide();
	//show loader
	$('#data_loader').show();
	
	$(".tab").hide(); //Hide all content
	$(".tab-nav ul li:first").addClass("active").show(); //Activate first tab
	$(".tab:first").show(); //Show first tab content

	//On Click Event
	$(".tab-nav ul li").click(function() {

		$(".tab-nav ul li").removeClass("active"); //Remove any "active" class
		$(this).addClass("active"); //Add "active" class to selected tab
		$(".tab").hide(); //Hide all tab content

		var activeTab = $(this).find("a").attr("href"); //Find the href attribute value to identify the active tab + content
		$(activeTab).show(); //Fade in the active ID content
		return false;
	});

	TableTools.DEFAULTS.sSwfPath = "js/lib/tabletools/media/swf/copy_cvs_xls_pdf.swf";
	TableTools.DEFAULTS.sRowSelect = "multi";
		
	// Check to see if we have access to nsfstarmetrics server 
	$.ajax({
		url: "http://128.150.10.70/py/api.py/access",
		dataType: 'JSONP',
		timeout: 2000,
		success: function(data) {
//console.log(data);
			proposalaccessallowed = true;
			apiurl = "http://128.150.10.70/py/api.py/";
			//call the template's initialization function - each template must define this for it to be executed
			init();
//alert('success');
//alert(proposalaccessallowed);
//alert(apiurl);			
//console.log(apiurl);
		},
		error: function(x,t,m) {
//alert('error');
//alert(t);
//			console.log(data);
			//call the template's initialization function - each template must define this for it to be executed
			init();
		}
	});

	//put all your jQuery goodness above this.
});

/* trap for generic multi select checkbox */
$('input#multiselect').click(function() {
});

/** TOPICS **/
/** topics handling functions **/
function resetTopics() {
	resetTopicSummary();
	
	//clear out existing data before showing to reset old results
	$('#topics_table').empty();	
}

function resetTopicSummary() {
//console.log('resetting topic summaries');
	//reset topic summaries
	$('#topics_summary_count_selected').html('');
	$('#topics_summary_count').html('');
	$('#topics_summary_selected').html('');		

	//reset the topic summaries
	$('span[id=topics_summary_award_count], span[id=topics_summary_award_funding], ul[id^=topics_summary_award_]').html('');
	$('span[id=topics_summary_decline_count], span[id=topics_summary_decline_funding], ul[id^=topics_summary_decline_]').html('');
	$('span[id=topics_summary_propose_count], span[id=topics_summary_propose_funding], ul[id^=topics_summary_propose_]').html('');

	//disable buttons
	$('a[id^=topics_submit]').addClass('disabled');	
}

function clearTopicSelection() {
	var oTable = $('#topics_table').dataTable();
	var selectedRows = fnGetSelectedRows(oTable);
	$.each(selectedRows, function(i, item){
		$(selectedRows[i]).find('input[name="topic[]"]').attr('checked',false);
		$(selectedRows[i]).removeClass('row_selected');
		$(selectedRows[i]).removeClass('DTTT_selected');
		//clear summary
		resetTopicSummary();
	});
}

/*loadTopics */
/*
topics data retrieved from the data source

Returns: JSON data
*/
function loadTopics(queryparams,includefilter) {
	$('#topics_loader').show();
//console.log(apiurl+'topic?'+queryparams+'&jsoncallback=?');	
	$.getJSON(apiurl+'topic?'+queryparams+'&jsoncallback=?', function(data) {
		topicsummarydata_pge=[];
		topicsummarydata_org=[];
		topicsummarydata_year=[];
		initTopics(data["data"],includefilter);
		//hide loader
		$('#data_loader').hide();
		//show main content container
		$('#main').show();

		$('#topics').show();
		$('#topics_loader').hide();

		//what are the currently selected filter statuses
		var filter_status = $('input[name=filter_status]:checked').val();
		//if decline or other is checked, show decline tab
		if (filter_status=='completed') {
			$('#topics_summary_award').show();		
			if (proposalaccessallowed) {
				$('#topics_summary_decline').show();					
			}
		}
	});
}

/* initTopics */
/*
topics data loaded into datatable
both topics data tabs are loaded

Param: rawdata (array)

Returns: nothing
*/
function initTopics(rawdata,includefilter) {
	//prepare data
	//group by t1
	var grouped = _.groupBy(rawdata,function(row) { return row["t1"]; });
//console.log(grouped);	
//console.log(legend_topics);
	//now assemble
	var collated = [];
	for (var t1 in grouped) {
//console.log(grouped[t1]);	
//console.log(t1);
		if (t1=='undefined') var topicid = '0';
		else var topicid = t1;
		if (topicid=='0') var suppress = '1';
		else var suppress = '0';
		//now reduce
		collated.push(_.reduce(grouped[t1],function(memo,row) {
//console.log(topicid);			
			if (!legend_topics[topicid]["label"]) var label = 'Not Electronically Readable';
			else var label = legend_topics[topicid]["label"];
			if (!legend_topics[topicid]["words"]) var words = '';
			else var words = legend_topics[topicid]["words"];
			var count_awarded = 0;
			var count_declined = 0;
			var count_other = 0;
			var funding_awarded = 0;
			var funding_requested = 0;
			if (row["status"]=="award") {
				funding_awarded = row["awarded_dollar"];
				count_awarded = row["count"];
			} else if (row["status"]=="decline") {
				count_declined = row["count"];
			} else {
				count_other = row["count"];
			}
			if (row["request_dollar"]) funding_requested = row["request_dollar"];
			return {"t1":memo["t1"],"label":label,"words":words,"count_awarded":memo["count_awarded"]+count_awarded,"count_declined":memo["count_declined"]+count_declined,"count_other":memo["count_other"]+count_other,"funding_awarded":memo["funding_awarded"]+funding_awarded,"funding_requested":memo["funding_requested"]+funding_requested,"suppress":memo["suppress"]};
		},{"t1":topicid,"label":null,"words":null,"count_awarded":0,"count_declined":0,"count_other":0,"funding_awarded":0,"funding_requested":0,"suppress":suppress})); //the suppres attribute is used to suppress t0 topics for now
	}
//console.log(collated);

	//prepare for datatable data - conv to array
	var aaData = _.map(collated, function(row) {
		return [row["t1"], row["label"], row["words"], row["count_awarded"],row["funding_awarded"],row["count_declined"],row["count_other"],row["funding_requested"],row["suppress"]];
	});
//console.log(aaData);		

	var oTable = $('#topics_table').dataTable({
		//TableTools - copy, csv, print, pdf
		"bJQueryUI": true,
		"sPaginationType": "full_numbers",
		//"sDom": 'T<"clear">lfrtip',
		//"sDom": 'T<"clear"><"H"lfr>t<"F"ip>',
		"sDom": '<"H"lTfr>t<"F"ip>',
        "oTableTools": {
            "aButtons": [
                {
                    "sExtends":    "collection",
                    "sButtonText": "Export as CSV",
                    "aButtons":    [ "csv" ]
                }
            ]
        },
		"bDestroy": true,
		"bProcessing": true,
		"bAutoWidth": false,
		"iDisplayLength": 50,
		"aaData": aaData,
		"aoColumnDefs": [
			{
				"fnRender": function ( oObj ) {
					return '<input type="checkbox" name="topic[]" value="'+oObj.aData[0]+'">';
				},
				"sClass": "center",
				"bUseRendered": false,
				"bSearchable": false,
				"bSortable": false,
				"sTitle": "Select",
				"aTargets": [ 0 ]
			},
			{
				"fnRender": function ( oObj ) {
					var html = '<strong>t'+oObj.aData[0]+': '+oObj.aData[1]+'</strong>';
					if (oObj.aData[2]) html += ' - '+oObj.aData[2];
					return html;
				},
				"sTitle": "Topic",
				"aTargets": [ 1 ]
			},
			{
				"bVisible": false,
				"aTargets": [2]
			},
			{
				"sTitle": "Awarded",
				"bVisible": false,
				"aTargets": [ 3 ]
			},
			{
				"fnRender": function ( oObj ) {
					return formatFunding(oObj.aData[4]);
				},
				"bUseRendered": false,
				"bVisible": false,
				"sTitle": "Awarded Amt.",
				"aTargets": [ 4 ]
			},
			{
				"bVisible": false,
				"sTitle": "Declined",
				"aTargets": [ 5 ]
			},
			{
				"bVisible": false,
				"sTitle": "Other",
				"aTargets": [ 6 ]
			},
			{
				"fnRender": function ( oObj ) {
					return formatFunding(oObj.aData[7]);
				},
				"bUseRendered": false,
				"bVisible": false,
				"sTitle": "Requested Amt.",
				"aTargets": [ 7 ]
			},
			{
				"bVisible": false,
				"aTargets": [ 8 ]
			},
			{
				"fnRender": function ( oObj ) {
					if (oObj.aData[0]=='0') return '';
					else return '<a id="topic_details_'+oObj.aData[0]+'" class="show-details">Show</a>';
				},
				"bSearchable": false,
				"bSortable": false,
				"aTargets": [ 9 ]
			}
		],
		"aaSorting": [[8, 'asc'],[3, 'desc']]
	});
	
	//conditional columns as necessary
	//what are the currently selected filter statuses
	var filter_status = $('input[name=filter_status]:checked').val();

	//prepare columns
	//conditional columns
	//if showing completed actions
//console.log(filter_status);	
	if (filter_status=='completed') {
		oTable.fnSetColumnVis( 3, true );
		oTable.fnSetColumnVis( 4, true );
		if (proposalaccessallowed) {
			oTable.fnSetColumnVis( 5, true );
			oTable.fnSetColumnVis( 7, true );			
		}
	} else if (proposalaccessallowed) {
		oTable.fnSetColumnVis( 6, true );
		oTable.fnSetColumnVis( 7, true );		
	}

	//add a form element to the table header
	if (includefilter) $('<div id="topic_operator_container">Inclusion*: <select name="filter_topic_operator"><option value="," selected>Awards matching ANY selected Topic</option><option value="+">Awards matching ALL selected Topics</option></select></div>').insertAfter('#topics_table_length');
}

function showTopicDetails(topic) {
	var topicid = $(topic).attr('id').split('_').pop();
	var table = $('#topics_table').dataTable();
	var row = topic.parentNode.parentNode; //we need the node, not the jQuery object
	var link = $(topic);
	if ($(topic).html()=='Show') {
		//filter rawdata by selected topic
		//get additional summary data for institutions, researchers
		//make query params
		var queryparams = '';
		//years
		queryparams = 'year='+$('select[name=filter_year_from] option:selected').val()+'-'+$('select[name=filter_year_to] option:selected').val();		
		queryparams += '&t1='+topicid;
		//now show it
		var params = queryparams+"&summ=org,status,pge";

		link.html('Hide');
		table.fnOpen(row, "<span id='topic_details_loader_"+topicid+"' class='loader'>Loading...</span><div class='dataInnerts' id='topic_details_container_" + topicid + "'><table id='breakdownbypge_"+topicid+"'></table><div class='topic-details-coocc' id='coocc_"+topicid+"'></div></div>", 'details' );
		$("#topic_details_container_" + topicid).hide();
		$.getJSON(apiurl + 'topic?' + params + '&jsoncallback=?', function(data) {
			//group by pge
			var grouped = _.groupBy(data["data"],function(row) { return row["pge"]; });
		//console.log('grouped');		
		//console.log(grouped);		
			//now assemble
			var collated = [];
			for (var pge in grouped) {
				var orgs = _.uniq(_.pluck(grouped[pge],'org')).join(', ');
				collated.push(_.reduce(grouped[pge],function(memo,row) {
					var count_awarded = 0;
					var count_declined = 0;
					var count_other = 0;
					var funding_awarded = 0;
					var funding_requested = 0;
					if (row["status"]=="award") {
						funding_awarded = row["awarded_dollar"];
						count_awarded = row["count"];
					} else if (row["status"]=="decline") {
						count_declined = row["count"];
					} else {
						count_other = row["count"];
					}
					if (row["request_dollar"]) funding_requested = row["request_dollar"];
					return {"t1":memo["t1"],"pge":memo["pge"],"orgs":orgs,"count_awarded":memo["count_awarded"]+count_awarded,"count_declined":memo["count_declined"]+count_declined,"count_other":memo["count_other"]+count_other,"funding_awarded":memo["funding_awarded"]+funding_awarded,"funding_requested":memo["funding_requested"]+funding_requested};
				},{"t1":topicid,"pge":pge,"orgs":orgs,"count_awarded":0,"count_declined":0,"count_other":0,"funding_awarded":0,"funding_requested":0}));
			}
		//console.log(collated);
		var sorted = _.sortBy(collated,function(row) { if ($('input[name=filter_status]:checked').val()=='completed') return row["count_awarded"]; else return row["count_other"]; });
		//console.log('sorted');		
		//console.log(collated);		
		var data_pge = _.last(sorted,6).reverse();
		//console.log('top');		
		//console.log(data_pge);		
		//before displaying, get the label for the pge codes
		var pge_codes = _.pluck(data_pge,"pge");
		if (pge_codes.length) {
			var legend_pges = {};
			$.getJSON(apiurl+'proposal?legend=nsf_pge&q='+pge_codes.join(',')+'&jsoncallback=?', function(data) {
				_.each(data, function(item) {							
					legend_pges[item["nsf_pge"]] = {"label":item["label"],"full_label":item["full_label"]};
				});

				//what are the currently selected filter statuses
				var filter_status = $('input[name=filter_status]:checked').val();

				var html = '';
				html += '<tr class="topic-details">';
				html += '<th>PGE Code (Total:'+sorted.length+')</th>';
				html += '<th>Division</th>';
				//conditional columns as necessary
				//prepare columns
				//conditional columns
				//if showing completed actions
			//console.log(filter_status);	
				if (filter_status=='completed') {
					html += '<th>Awarded</th>';
					html += '<th>Awarded Amt.</th>';
					if (proposalaccessallowed) {
						html += '<th>Declined</th>';
						html += '<th>Requested Amt.</th>';
					}
				} else if (proposalaccessallowed) {
					html += '<th>Other</th>';
					html += '<th>Requested Amt.</th>';
				}
				html += '</tr>';
				_.each(data_pge, function(item){
			//console.log($("#topic_details_groupedby_pge_template").tmpl(item));		
					html += '<tr class="topic-details topic_details_'+item["t1"]+'">';
					html += '<td>p'+item["pge"]+(legend_pges[item["pge"]]?':'+legend_pges[item["pge"]]["label"]:'')+'</td>';
					html += '<td>'+item["orgs"]+'</td>';
					//conditional columns as necessary
					//prepare columns
					//conditional columns
					//if showing completed actions
				//console.log(filter_status);	
					if (filter_status=='completed') {
						html += '<td>'+item["count_awarded"]+'</td>';
						html += '<td>'+formatFunding(item["funding_awarded"])+'</td>';
						if (proposalaccessallowed) {
							html += '<td>'+item["count_declined"]+'</td>';
							html += '<td>'+formatFunding(item["funding_requested"])+'</td>';
						}
					} else if (proposalaccessallowed) {
						html += '<td>'+item["count_other"]+'</td>';
						html += '<td>'+formatFunding(item["funding_requested"])+'</td>';
					}
					html+='</tr>';
				});
			//console.log(html);	
				$("#breakdownbypge_"+topicid).html(html);
				});			
			}
			
			//get co-occurring topics
			$.getJSON('coocctopics.php?t=' + topicid, function(data) {
				var tmp = data.split(',');
				var cooccurringtopics = _.map(tmp,function(item) {
					var tmp = 't'+item;
					if (legend_topics[item]) tmp += ':'+legend_topics[item]["label"];
					return tmp;
				});
		//console.log(cooccurringtopics);
		//console.log(html);		
				$("#coocc_"+topicid).html('<span class="topic_details_coocc_'+topicid+'">Co-occurring Topics: '+cooccurringtopics.join(', ')+'</span>');
			});	

			$("#topic_details_loader_" + topicid).hide();
			$("#topic_details_container_" + topicid).show();
		});				
		//set the class
		$(topic).removeClass('show-details');
		$(topic).addClass('hide-details');
	} else {
		link.html('Show');
		$("#topic_details_container_" + topicid).slideUp(function() {
			table.fnClose(row);
		});
		//set the class
		$(topic).removeClass('hide-details');
		$(topic).addClass('show-details');
	}
}

/* updateTopicSummary */
/*
update topic selection summary

Param: rawdata (array)

Returns: nothing
*/
function updateTopicSummary(rawdata) {
//console.log(rawdata);	
	//compute the summaries
	//filter by status - award
	//first filter by status - award
	var filtered = _.filter(rawdata, function(item) { return item[3]>0; });
//console.log(filtered);	
	$('#topics_summary_award_count').html(_.reduce(filtered, function(memo, row){ return memo + row[3]; }, 0));
	$('#topics_summary_award_funding').html(formatFunding(_.reduce(filtered, function(memo, row){ return memo + row[4]; }, 0)));
	//show ranked topics
	//sort by awards
	_.sortBy(filtered,function(row) { return row[3];});
//console.log(collated);	
	//use only top 3
	var top = _.first(filtered,3)
//console.log(top);
	//make into display array
	var summary = _.map(top,function(row) {
		var label = legend_topics[row[0]]?legend_topics[row[0]]["label"]:'';
		return {"key":'t'+row[0],"lookup":'',"label":label,"count":row[3],"funding":row[4]};
	});
//console.log(summary);	
	//display
	//clear first
	$('#topics_summary_award_t1 li').remove();
	_.each(summary, function(item) {
		$($('#topics_summary_rank_template').tmpl(item)).appendTo('#topics_summary_award_t1');
	});
	
	//next filter by status - decline
	var filtered = _.filter(rawdata, function(item) { return item[5]>0; });
	$('#topics_summary_decline_count').html(_.reduce(filtered, function(memo, row){ return memo + row[5]; }, 0));
	$('#topics_summary_decline_funding').html(formatFunding(_.reduce(filtered, function(memo, row){ return memo + row[7]; }, 0)));
	//show ranked topics
	//sort by awards
	_.sortBy(filtered,function(row) { return row[5];});
//console.log(collated);	
	//use only top 3
	var top = _.first(filtered,3)
//console.log(top);
	//make into display array
	var summary = _.map(top,function(row) {
		var label = legend_topics[row[0]]?legend_topics[row[0]]["label"]:'';
		return {"key":'t'+row[0],"lookup":'',"label":label,"count":row[5],"funding":row[7]};
	});
	//display
	//clear first
	$('#topics_summary_decline_t1 li').remove();
	_.each(summary, function(item) {
		$($('#topics_summary_rank_template').tmpl(item)).appendTo('#topics_summary_decline_t1');
	});
	
	//last filter by status - propose
	var filtered = _.filter(rawdata, function(item) { return item[6]>0; });
	$('#topics_summary_propose_count').html(_.reduce(filtered, function(memo, row){ return memo + row[6]; }, 0));
	$('#topics_summary_propose_funding').html(formatFunding(_.reduce(filtered, function(memo, row){ return memo + row[7]; }, 0)));
//console.log(filtered);
	//show ranked topics
	//sort by awards
	_.sortBy(filtered,function(row) { return row[6];});
//console.log(collated);	
	//use only top 3
	var top = _.first(filtered,3)
//console.log(top);
	//make into display array
	var summary = _.map(top,function(row) {
		var label = legend_topics[row[0]]?legend_topics[row[0]]["label"]:'';
		return {"key":'t'+row[0],"lookup":'',"label":label,"count":row[6],"funding":row[7]};
	});
	//display
	//clear first
	$('#topics_summary_propose_t1 li').remove();
	_.each(summary, function(item) {
		$($('#topics_summary_rank_template').tmpl(item)).appendTo('#topics_summary_propose_t1');
	});

	$('#topics_submit_awards').removeClass('disabled');
	$('#topics_submit_declines').removeClass('disabled');	
	$('#topics_submit_proposed').removeClass('disabled');
}

/* updateTopicSummaryData */
/*
update topic selection summary

Param: rawdata (array)

Returns: nothing
*/
function updateTopicSummaryData(rawdata,selected_topics,group) {
//console.log(rawdata);
//console.log(selected_topics);	
	//compute the summaries
	//first filter by selected topics
	var filtered = _.filter(rawdata, function(item) { return $.inArray(item['t1'],selected_topics)!=-1; });
//console.log(filtered);	
	//show by rank
	setTopicSummaryRanked(filtered,'award',group);
	setTopicSummaryRanked(filtered,'decline',group);
	setTopicSummaryRanked(filtered,'propose',group);

	$('#topics_summary_award_'+group+'_loader').hide();
	$('#topics_summary_decline_'+group+'_loader').hide();
	$('#topics_summary_propose_'+group+'_loader').hide();
}

function summarizeTopicBy(topicid, value, list) {
//console.log(key+' '+value);	
	return _.reduce(list,function(memo,row) {
//console.log(memo);		
		var count_awarded = 0;
		var count_declined = 0;
		var count_other = 0;
		var funding_awarded = 0;
		var funding_requested = 0;
		if (row["status"]=="award") {
			funding_awarded = row["awarded_dollar"];
			count_awarded = row["count"];
		} else if (row["status"]=="decline") {
			count_declined = row["count"];
		} else {
			count_other = row["count"];
		}
		if (row["request_dollar"]) funding_requested = row["request_dollar"];
		return {"t1":memo["t1"],"key":memo["key"],"count_awarded":memo["count_awarded"]+count_awarded,"count_declined":memo["count_declined"]+count_declined,"count_other":memo["count_other"]+count_other,"funding_awarded":memo["funding_awarded"]+funding_awarded,"funding_requested":memo["funding_requested"]+funding_requested};
	},{"t1":topicid,"key":value,"count_awarded":0,"count_declined":0,"count_other":0,"funding_awarded":0,"funding_requested":0})
}

function setTopicSummaryRanked(rawdata,status,group) {
	//first filter by status
	var filtered = _.filter(rawdata, function(item) { if (status=='award') return item['count_awarded']>0; else if (status=='decline') return item['count_declined']>0; else return item['count_other']>0; });
//console.log(filtered);
	
	//group by org
	var grouped = _.groupBy(filtered, "key");
//console.log(grouped);	
	//compute totals
	var collated = [];
	for (var key in grouped) {
		collated.push(_.reduce(grouped[key], function(memo, row) {
			var tkey = key;
			var lookup = '';
			//format
			if (group=='pge') { tkey = 'p'+key; lookup = 'pgecode_lookup_'+key; }
			var funding = 0;
			if (status=="award") {
				funding = row["funding_awarded"];
				var count = row["count_awarded"];
			} else {
				funding = row["funding_requested"];
				if (status=="decline") {
					var count = row["count_declined"];				
				} else {
					var count = row["count_other"];				
				}
			}
			return {"key":tkey,"lookup":lookup,"label":'',"count":memo["count"]+count,"funding":memo["funding"]+funding};
		},{"key":key,"lookup":'',"label":'',"count":0,"funding":0}));
	}
	//sort by awards
	_.sortBy(collated,function(row) { return row["count"];});
//console.log(collated);	
	//use only top 3
	var top = _.first(collated,3);
//console.log(top);		
	//display
	//clear first
	$('#topics_summary_'+status+'_'+group+' li').remove();
	_.each(top, function(item) {
		$($('#topics_summary_rank_template').tmpl(item)).appendTo('#topics_summary_'+status+'_'+group);
	});
	
}

/** researchers data tab handling functions **/
//init Researchers
function initResearchers(data) {
	var aaData = _.map(data, function(v) { 
		return [
			v["nsf_id"], 
			keyExists("name", v, "Not Available"), 
			keyExists("inst.name", v, "Not Available"),
			keyExists("inst.dept", v, "Not Available"),
			v["count"],
			v["prop"].join(", "),
			'Show',
		]; 
	});

	var oTable = $('#researchers_table').dataTable({
		//TableTools - copy, csv, print, pdf
		"bJQueryUI": true,
		"sPaginationType": "full_numbers",					
		//"sDom": 'T<"clear">lfrtip',
		//"sDom": 'T<"clear"><"H"lfr>t<"F"ip>',
		"bDestroy": true,
		"bProcessing": true,
		"bAutoWidth": false,
		"iDisplayLength": 50,
		"aoColumnDefs": [
			{
				"sTitle": "PI ID",
				"aTargets": [ 0 ]
			},
			{ 
				"sTitle": "Name", 
				"aTargets": [ 1 ] 
			}, 
			{ "sTitle": "Institution", "aTargets": [ 2 ] }, 
			{ "sTitle": "Department", "aTargets": [ 3 ] },  
			{ 
				"sTitle": "Count*", 
				"aTargets": [ 4 ] 
			},  
			{ 
				"fnRender": function ( oObj ) {
					//wrap each prop id in a link
					var formatted = [];
					if (oObj.aData[5]) {
						var tmp = oObj.aData[5].split(', ');
						for (var i in tmp) {
							var link = 'http://www.nsf.gov/awardsearch/showAward.do?AwardNumber='+tmp[i];
							var title = 'Open in nsf.gov';
							if (proposalaccessallowed) {
								link = 'https://www.ejacket.nsf.gov/ej/showProposal.do?optimize=Y&ID='+tmp[i]+'&docid='+tmp[i];
								title = 'Open in e-Jacket';
							}
							formatted.push('<a href="'+link+'" title="'+title+'" target="_blank">'+tmp[i]+'</a>');
						}

					}
					return formatted.join(', ');
				},
				"bUseRendered": false,
				"sTitle": "IDs**", 
				"aTargets": [ 5 ] 
			},
			{ 
				"fnRender": function ( oObj ) {
					return '<a class="researcher_details show-details" title="'+oObj.aData[6]+'">Show</a>';
				},
				"bSearchable": false,
				"bSortable": false,						
				"sTitle": "Details",
				"aTargets": [ 6 ]
			}
		],
		"aaData": aaData,
		"aaSorting": [[4, 'desc']],
		"oLanguage": {
			"sLengthMenu:": "Display _MENU_ records per page",
			"sSearch": "Keyword Filter:"
		}
		//"sDom": 'T<"clear">lfrtip',
	});
	
	//hide pi id if public
	if (!proposalaccessallowed) {
		oTable.fnSetColumnVis( 0, false );
	}		
}

function showResearcherDetails(researcher,eventvar) {
	var oTable = $('#researchers_table').dataTable();
    var aData = oTable.fnGetData(researcher); // get datarow
//console.log(fnGetSelected(oTable));

	//load prop data for selected pis so we can calculate summaries and rankings
	var filtered_propids = [];
	var tmp_propids = aData[5];
	//make array out of string
	if (tmp_propids) propids = tmp_propids.split(',');
	//now load the data for each propid if it is not already loaded
	var params = '';
//console.log(propsummarydata);		
	for (var i in filtered_propids) {
		var propid = jQuery.trim(filtered_propids[i]);
		//if not previously loaded and cached, load it
		if (!propsummarydata[propid]) {
			if (params) params += ',';
			params += propid;
		}
	}
//console.log(params);

	//if the show details link was clicked trap that		
   if(eventvar.target.nodeName == "A"){
		if ($(eventvar.target).hasClass('researcher_details')) {		
			var pi_node = researcher;
			if (pi_node != null) {
				var pData = oTable.fnGetData(pi_node);
				if ( $(eventvar.target).html().match('Hide') )
				{
					$(eventvar.target).html('Show');
					//set the class
					$(eventvar.target).removeClass('hide-details');
					$(eventvar.target).addClass('show-details');
					$("#pi_" + pData[0]).slideUp(function() {
						oTable.fnClose(pi_node);
					});
				}
				else
				{
					$(eventvar.target).html('Hide');
					//set the class
					$(eventvar.target).removeClass('show-details');
					$(eventvar.target).addClass('hide-details');
					var tr_details = oTable.fnOpen(pi_node, "<div class='dataInnerts overflow' id='pi_" + pData[0] + "'><span id='pi_loader_"+pData[0]+"' class='loader'>Loading...</span><table><tr><td class='pi_details_user' id='userDetails_"+pData[0]+"'></td><td class='pi_details_prop'><span id='pi_summary_loader_"+pData[0]+"' class='loader'>Loading...</span><span id='pi_proposal_summary_"+pData[0]+"'></span></td><td><strong>Patents: <span id='pi_patents_loader_"+pData[0]+"'>Loading...</span></strong><span id='pi_patent_summary_"+pData[0]+"'></span></td></tr></table><table class='pi_details_proplist' id='pi_propList_"+pData[0]+"'></table><div id='pi_patents_" + pData[0] + "'><h3>Patents:</h3><table class='dataInnerts'><thead><tr><th>ID</th><th>Title</th><th>Application Year</th><th>Grant Year</th><th>Assignee</th></thead><tbody id='patents_rows_" + pData[0] + "'></tbody></table></div></div>", 'details' );
					$(tr_details).addClass('details');
					$("#pi_" + pData[0]).hide();
					$("#pi_" + pData[0]).slideDown();
					//get pi details
					//load pi data
					$.getJSON(apiurl+'user?id=' + pData[0] + '&jsoncallback=?', function(data) {
						if (data["data"].length>0) {
							var row = data["data"][0];
							if (!row["inst"]) { 
								row["inst"] = {"name":"","dept":""}; 
							}
							$($("#personRender").tmpl(row)).appendTo("#userDetails_" + pData[0]);								
						}
						$("#pi_loader_" + pData[0]).hide();
					});						
					//get list of all proposals for user
					//http://readidata.nitrd.gov/star/py/api.py/user?id=000225166&page=prop
					//extract list of proposals
					$.getJSON((apiurl+'user?id=' + pData[0]) + '&page=prop' + '&jsoncallback=?', function(data) {
//console.log(data["data"]);							
						//extract the proposal ids
						var propids_awarded = new Array();
						var propids_declined = [];
						var propids_proposed = [];
						if (data["data"]["nsf"]["award"]) propids_awarded = _.pluck(data["data"]["nsf"]["award"]["data"],"nsf_id");
//console.log(propids_awarded);						
						if (data["data"]["nsf"]["decline"]) propids_declined = _.pluck(data["data"]["nsf"]["decline"]["data"],"nsf_id");
//console.log(propids_declined);						
						if (data["data"]["nsf"]["propose"]) propids_proposed = _.pluck(data["data"]["nsf"]["propose"]["data"],"nsf_id");
//console.log(propids_proposed);						
						var propids = propids_awarded.concat(propids_declined.concat(propids_proposed));
						//console.log(propids);	
						//now load the proposals
						if (propids.length>0) {
							$.getJSON(apiurl + 'proposal?id=' + propids.join(',') + '&jsoncallback=?', function(data) {
								//for each prop store the data in the cache if it is part of the currently filtered set
								if (data["data"]) {
									for (var i in data["data"]) {							
						//console.log(data["data"][i]["nsf_id"]);
										if ($.inArray(data["data"][i]["nsf_id"],filtered_propids)!=-1) propsummarydata[data["data"][i]["nsf_id"]] = data["data"][i];
									}
								}
								//render prop list
								renderPropList('pi',pData[0],data,propids,propids_awarded,propids_declined,propids_proposed,pData[0]);
							});
						}							
					});
					//patents
					$.getJSON(apiurl+'user?id=' + pData[0] + '&page=patent' + '&jsoncallback=?', function(data) {
						if (data["count"]>0) {
							_.each(data["data"],function(row) {
								if (!row["title"]) row["title"] = '';
								$($("#patentRender").tmpl(row)).appendTo("#patents_rows_" + pData[0]);
							});
							$("#pi_patents_"+pData[0]).slideDown();
						} else {
							$("#pi_patents_"+pData[0]).slideUp();								
						}
						$("#pi_patents_loader_" + pData[0]).hide();
						$("#pi_patent_summary_"+pData[0]).html(data["count"]);
					});						
				}
			}
			eventvar.preventDefault();
		    return;
		} else {
			return;
		}
	}

    //var aData = oTable.fnGetData(researcher); // get datarow
    if (null != aData)  // null if we clicked on title row
    {
		//set the class
		if ( $(researcher).hasClass('row_selected') ) {
			$(researcher).removeClass('row_selected');
			$(researcher).removeClass('DTTT_selected');
		} else {
			$(researcher).addClass('row_selected');
			$(researcher).addClass('DTTT_selected');
		}
		updateResearcherSummary(aData,$(researcher).hasClass('row_selected'));			
    }
}

/* update summary */
function updateResearcherSummary(aData,selected) {
	//now aData[0] - 1st column(count_id), aData[1] -2nd, etc. 
	//trap grant selection
	var numPIsSelected = $("#summary_pis").html();
	if (selected) {
		numPIsSelected++; 
	} else {
		numPIsSelected--;
	}

	$("#summary_pis").html(numPIsSelected);

//console.log(fnGetSelected(oTable));
	//load prop data for selected pis so we can calculate summaries and rankings
	var propids = [];
//	var rowdata = oTable.fnGetData(this);
	var tmp_propids = aData[5];
	//make array out of string
	if (tmp_propids) propids = tmp_propids.split(',');
	//now load the data for each propid if it is not already loaded
	var params = '';
	for (var i in propids) {
		var propid = jQuery.trim(propids[i]);
		//if not previously loaded and cached, load it
		if (!propsummarydata[propid]) {
			if (params) params += ',';
			params += propid;
		}
	}
	if (params) {
//console.log('getting data:'+params);
		$.getJSON(apiurl + 'prop?id=' + params + '&jsoncallback=?', function(data) {
//console.log(data);
			//for each prop store the data in the cache
			if (data["data"]) {
				for (var i in data["data"]) {							
//console.log(data["data"][i]["nsf_id"]);							
					propsummarydata[data["data"][i]["nsf_id"]] = data["data"][i];
				}
			}
			summarizePI();
		});
	} else {
		summarizePI();
	}	
}

function summarizePI() {
//console.log(propsummarydata);
	//now recalculate the rankings - do this regardless of checked or unchecked
	//current checked items
	var oTable = $("#researchers_table").dataTable();
	var checkedpis =  _.map(fnGetSelected(oTable),function(v) {
//console.log(v);		
		var tmp = {};
		tmp['propcount'] = v[4];

		//now total up the funding for all the proposals
		var awardcount = 0;
		var requestfunding = 0;
		var awardfunding = 0;

		var propids = [];
		var tmp_propids = v[5];
		//make array out of string
		if (tmp_propids) propids = tmp_propids.split(',');
		for (var i in propids) {
			var propid = jQuery.trim(propids[i]);
			//read from cache
//console.log(propid);			
			if (propsummarydata[propid]) {
				if (propsummarydata[propid]["status"]["name"]=="award") {
					awardcount++;
					if (propsummarydata[propid]["awarded"] && propsummarydata[propid]["awarded"]["dollar"])
						awardfunding += parseInt(propsummarydata[propid]["awarded"]["dollar"]);
				}
				if (propsummarydata[propid]["request"] && propsummarydata[propid]["request"]["dollar"]) requestfunding += parseInt(propsummarydata[propid]["request"]["dollar"]);						
			}
		}
		tmp['awardcount'] = awardcount;
		tmp['awardfunding'] = awardfunding;
		if (awardcount) tmp['avgawardfunding'] = (awardfunding/awardcount).toFixed(0);
		else tmp['avgawardfunding'] = 0;
		tmp['requestfunding'] = requestfunding;
		//add the topic id
		tmp['id'] = v[0];
		tmp['name'] = v[1];

		return tmp;			
	});	

	//now for the researcher rankings
	//by number of proposals
	//sort the summaries list - descending by number of proposals submitted
	checkedpis.sort(function(a,b) {return (parseInt(a.propcount) > parseInt(b.propcount)) ? -1 : ((parseInt(b.propcount) > parseInt(a.propcount)) ? 1 : 0);} );	
	//now select the top 5 out of the summaries list
	for (var i=0;i<5;i++) {
		//we always reset this - just for now, for simplicity sake, later we can add a check to see if the rankings need to be updated or not
		$("#summary_rankedpis_bypropcount_"+(i+1)).html(null);	
		if (checkedpis[i]) {
			//we found one, add it to the summary
			$("#summary_rankedpis_bypropcount_"+(i+1)).html(checkedpis[i]['propcount']+' ('+checkedpis[i]['name']+')');				
		}
	}
	//by number of awards
	//sort the summaries list - descending by number of awarded proposals
	checkedpis.sort(function(a,b) {return (parseInt(a.awardcount) > parseInt(b.awardcount)) ? -1 : ((parseInt(b.awardcount) > parseInt(a.awardcount)) ? 1 : 0);} );	
//console.log(checkedpis);		
	//now select the top 5 out of the summaries list
	for (var i=0;i<5;i++) {
		//we always reset this - just for now, for simplicity sake, later we can add a check to see if the rankings need to be updated or not
		$("#summary_rankedpis_byawardcount_"+(i+1)).html(null);	
		if (checkedpis[i] && checkedpis[i]['awardcount']) {
			//we found one, add it to the summary
			$("#summary_rankedpis_byawardcount_"+(i+1)).html(checkedpis[i]['awardcount']+' ('+checkedpis[i]['name']+')');				
		}
	}
	//by number of award funding
	//sort the summaries list - descending by funding of awarded proposals
	checkedpis.sort(function(a,b) {return (parseInt(a.awardfunding) > parseInt(b.awardfunding)) ? -1 : ((parseInt(b.awardfunding) > parseInt(a.awardfunding)) ? 1 : 0);} );	
//console.log(checkedpis);		
	//now select the top 5 out of the summaries list
	for (var i=0;i<5;i++) {
		//we always reset this - just for now, for simplicity sake, later we can add a check to see if the rankings need to be updated or not
		$("#summary_rankedpis_byawardfunding_"+(i+1)).html(null);	
		if (checkedpis[i] && checkedpis[i]['awardfunding']) {
			//we found one, add it to the summary
			$("#summary_rankedpis_byawardfunding_"+(i+1)).html('$'+addCommas(checkedpis[i]['awardfunding'])+' ('+checkedpis[i]['name']+')');				
		}
	}
	//by avg. award funding by grant
	//sort the summaries list - descending by funding of awarded proposals
	checkedpis.sort(function(a,b) {return (parseFloat(a.avgawardfunding) > parseFloat(b.avgawardfunding)) ? -1 : ((parseFloat(b.avgawardfunding) > parseFloat(a.avgawardfunding)) ? 1 : 0);} );	
//console.log(checkedpis);		
	//now select the top 5 out of the summaries list
	for (var i=0;i<5;i++) {
		//we always reset this - just for now, for simplicity sake, later we can add a check to see if the rankings need to be updated or not
		$("#summary_rankedpis_byavgawardfunding_"+(i+1)).html(null);	
		if (checkedpis[i] && checkedpis[i]['avgawardfunding']) {
			//we found one, add it to the summary
			$("#summary_rankedpis_byavgawardfunding_"+(i+1)).html('$'+addCommas(checkedpis[i]['avgawardfunding'])+' ('+checkedpis[i]['name']+')');				
		}
	}
}

//renderProposalList - detail view
function renderPropList(tab, tab_itemid, data, propids, propids_awarded, propids_declined, propids_proposed, piid) {
	renderPropStatus(tab, tab_itemid, data, propids_awarded, 'award', 'awarded', 'Awarded');
	renderPropStatus(tab, tab_itemid, data, propids_declined, 'decline', 'request', 'Declined');
	renderPropStatus(tab, tab_itemid, data, propids_proposed, 'propose', 'request', 'Other');
	//co-collaborators					
	$.getJSON(apiurl+'proposal?id=' + propids.join(',') + '&page=pi' + '&jsoncallback=?', function(data) {
		if (data["data"]) {
			// Use $.each() to get all the PIs
			$.each(data["data"], function(i, item){
				var copi_propids = item["prop"];
				//find the ones that match what we have for this pi
				if (copi_propids.length>0) {
					//intersection
					var common_propids = _.intersection(copi_propids,propids);
					if (common_propids.length>0) {
						_.each(common_propids, function(propid) {
//console.log(piid+' '+item["nsf_id"]);
							//if it's not the current pi show it
							if ((piid && item["nsf_id"]!=piid)||piid==null) $('<li>'+item["name"]+'</li>').appendTo("#"+tab+"_proposal_copis_" + propid+"_"+tab_itemid); //$($("#copiRender").tmpl(item))
						});
					}
				}
			});											
		}
		$(".proposal_copis_loader").hide();
	});
	//topics
	$.getJSON(apiurl+'topic?id=' + propids.join(',') + '&jsoncallback=?', function(data) {
		// Use $.each() to get all the topics
		_.each(data["data"], function(item){
			if (item["topic"]["id"] && item["topic"]["id"].length>0) {
				var topics = [];
				_.each(item["topic"]["id"], function(topicid) {
					var t1 = topicid==null ? '0' : topicid;
					var label = legend_topics[t1]["label"]==undefined ? 'Not Electronically Readable' : legend_topics[t1]["label"];
					topics.push('t'+t1+': '+label);													
				});
				if (topics.length>0) {
//console.log("#"+tab+"_proposal_topics_" + tab_itemid);					
					//$('<li>'+topics.join(', ')+'</li>').appendTo("#proposal_topics_" + item["proposal"]["nsf_id"]);	
					$("#"+tab+"_proposal_topics_" + item["proposal"]["nsf_id"]+"_"+tab_itemid).html(topics.join(', '));																									
				}
			}
		});
		$(".proposal_topics_loader").hide();
	});
	//summarize
	var mindate = null;
	var maxdate = null;
	//total
	var summarized = _.reduce(data["data"],function(memo,row) {
		var count_total = memo["count_total"]+1;
		var count_awarded = memo["count_awarded"];
		var count_declined = memo["count_declined"];
		var count_other = memo["count_other"];
		var funding_awarded = memo["funding_awarded"];
		var funding_requested = memo["funding_requested"];
		if (row["status"]["name"]=="award") {
			count_awarded++;
			if (row["awarded"] && row["awarded"]["dollar"]) funding_awarded+=parseInt(row["awarded"]["dollar"]);
			if (row["awarded"] && row["awarded"]["date"]) var date = new Date(row["awarded"]["date"]);
			else var date = null;
		} else if (row["status"]["name"]=="decline") {
			count_declined++;
			if (row["request"] && row["request"]["dollar"]) funding_requested+=parseInt(row["request"]["dollar"]);
			if (row["request"] && row["request"]["date"]) var date = new Date(row["request"]["date"]);
			else var date = null;
		} else {
			count_other++;
			if (row["request"] && row["request"]["dollar"]) funding_requested+=parseInt(row["request"]["dollar"]);
			if (row["request"] && row["request"]["date"]) var date = new Date(row["request"]["date"]);											
			else var date = null;
		}
		//set max, min dates
		if (!mindate) mindate = date;
		else if (date < mindate) mindate = date;
		if (!maxdate) maxdate = date;
		else if (date > maxdate) maxdate = date;
		//return										
		return {"count_total":count_total,"count_awarded":count_awarded,"count_declined":count_declined,"count_other":count_other,"funding_awarded":funding_awarded,"funding_requested":funding_requested};
	},{"count_total":0,"count_awarded":0,"count_declined":0,"count_other":0,"funding_awarded":0,"funding_requested":0});
	//now display
	$("#"+tab+"_summary_loader_" + tab_itemid).hide();
	var html = '';
	html += '<strong>Total: '+summarized["count_total"]+'</strong><br />';
	if (summarized["count_awarded"]>0) html += 'Awarded: '+summarized["count_awarded"]+' ('+formatFunding(summarized["funding_awarded"])+')<br />';
	if (summarized["count_declined"]>0) html += 'Declined: '+summarized["count_declined"]+' ('+formatFunding(summarized["funding_requested"])+')<br />';
	if (summarized["count_other"]>0) html += 'Other: '+summarized["count_other"]+' ('+formatFunding(summarized["funding_requested"])+')<br />';
	//dates
	if (mindate) html += 'Date First: '+mindate.getMonth()+'/'+mindate.getDate()+'/'+mindate.getFullYear()+'<br />';
	if (maxdate) html += 'Date Last: '+maxdate.getMonth()+'/'+maxdate.getDate()+'/'+maxdate.getFullYear()+'<br />';
	$('#'+tab+'_proposal_summary_'+tab_itemid).html(html);									
}

function renderPropStatus(tab, tab_itemid, data, propids, status, key, label) {
	if (propids.length>0) {
		$('<tr><td colspan="2"><h2 class="heading">'+label+'</h2></td></tr>').appendTo("#"+tab+"_propList_" + tab_itemid);
		var sorted = _.sortBy(data["data"],function(row) { if (row[key] && row[key]["date"]) return row[key]["date"]; else return null; }).reverse();
		$.each(sorted, function(i, item){
			if ($.inArray(item["nsf_id"],propids)!=-1) {
				item['tab'] = tab;
				item['tab_itemid'] = tab_itemid;
				if (!item["pge"]) { item["pge"] = {"code":"","full":""}; }
				var link = 'http://www.nsf.gov/awardsearch/showAward.do?AwardNumber='+item["nsf_id"];
				var linktitle = 'Open in nsf.gov';
				if (proposalaccessallowed) {
					link = 'https://www.ejacket.nsf.gov/ej/showProposal.do?optimize=Y&ID='+item["nsf_id"]+'&docid='+item["nsf_id"];
					linktitle = 'Open in e-Jacket';
				}
				item['link'] = link;
				item['linktitle'] = linktitle;
				$($("#propListRender").tmpl(item)).appendTo("#"+tab+"_propList_" + tab_itemid);
				if (item["status"]["name"]==status && item[key] && item[key]["dollar"] && item[key]["date"]) {
					$("#"+tab+"_proposal_status_"+item["nsf_id"]+"_"+tab_itemid).html(label+' $'+addCommas(item[key]["dollar"])+ ' on '+item[key]["date"]);
				}												
			}
		});										
	}	
}

function setRowSelected(row) {
	//set the class
	if ( !row.hasClass('row_selected') ) {
		row.addClass('row_selected DTTT_selected');
	}				
}

function setRowUnSelected(row) {
	if ( row.hasClass('row_selected') ) {
		row.removeClass('row_selected DTTT_selected');
	}							
}

/*
Creating a js library for the NSF data API

Reusable functions for the API front-end
*/

$.fn.serializeObject = function()
{
	var o = {};
	var a = this.serializeArray();
	$.each(a, function() {
	if (o[this.name] !== undefined) {
		if (!o[this.name].push) {
			o[this.name] = [o[this.name]];
		}
		o[this.name].push(this.value || '');
	} else {
		o[this.name] = this.value || '';
	}
	});
	return o;
};

/* NK - not sure what this is for, commenting out for now
var renderProp;
renderProp = function(q, me) {
  return $.getJSON(apiurl+'prop?' + q + '&jsoncallback=?', function(data) {
    $("#div_" + me + " div").html($("#propRender").tmpl(data["data"]));
    return $("#div_" + me).slideDown();
  });
}; */

function formatFunding(funding) {
//console.log(funding);
	if (funding && parseInt(funding)>0) return '$'+(funding/1000000).toFixed(2)+'M';
	else return '';
}

//adding commas to a number to format it
function addCommas(nStr)
{
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

//convert a formatted number string back to a pure number
function removeNumberFormatting(rawstring) {
	return rawstring.replace(/[^\d\.\-\ ]/g, '');	
}

// left padding s with c to a total of n chars
function padding_left(s, c, n) {
    if (! s || ! c || s.length >= n) {
        return s;
    }

    var max = (n - s.length)/c.length;
    for (var i = 0; i < max; i++) {
        s = c + s;
    }

    return s;
}

//Check to see if the data exists or is null 
function keyExists(key, object, value) {
	if (value == null)
		value = "";
	$(key.split(".")).each(function(i, v) {
		if (v in object) 
			object = object[v];
		else {
			object = value;
			return false;
		}
	});
	return object;
}

function fnGetSelected( oTableLocal )
{
    var aReturn = new Array();
    var aTrs = oTableLocal.fnGetNodes();
     
    for ( var i=0 ; i<aTrs.length ; i++ )
    {
        if ( $(aTrs[i]).hasClass('row_selected') )
        {
            aReturn.push( oTableLocal.fnGetData(aTrs[i]) ); //return data, not node
        }
    }
    return aReturn;
}

function fnGetSelectedRows( oTableLocal )
{
    var aReturn = new Array();
    var aTrs = oTableLocal.fnGetNodes();
     
    for ( var i=0 ; i<aTrs.length ; i++ )
    {
        if ( $(aTrs[i]).hasClass('row_selected') )
        {
            aReturn.push( aTrs[i] ); //return node
        }
    }
    return aReturn;
}

function fnGetNotSelectedRows( oTableLocal )
{
    var aReturn = new Array();
    var aTrs = oTableLocal.fnGetNodes();
     
    for ( var i=0 ; i<aTrs.length ; i++ )
    {
        if ( !$(aTrs[i]).hasClass('row_selected') )
        {
            aReturn.push( aTrs[i] ); //return node
        }
    }
    return aReturn;
}
