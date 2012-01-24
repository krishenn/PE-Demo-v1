//globals
var legend_classes = {};
var legend_topics = {};

function init() {
	//When page loads...
	//default org is CHE
	//$("#selected_orgs").append('<li><a href="#" title="Division of Chemistry - Click to remove" class="itemdelete"><span>CHE</span></a></li>');

	//load topic legend
	$.getJSON(apiurl+'topic?legend=topic'+'&jsoncallback=?', function(data) {
		_.each(data, function(item) {
			legend_topics[item["topic"]] = {"words":item["words"],"label":item["label"]};
		});
	});			

	//load classes legend
	$.getJSON(apiurl+'patent?legend=class'+'&jsoncallback=?', function(data) {
		_.each(data, function(item) {
			legend_classes[item["class"]] = item["label"];
		});
		//loadPatents();
		$('#patents').hide();
		//hide loader
		$('#data_loader').hide();	
		//show
		$('#main').show();	
		$('a#queryform_submit').removeClass("disabled");
	});			
	
	//set up autocomplete field
	var source = _.map(divisions, function(num, key){ return {"label":num,"value":key}; });
	//populate the select drop down
	_.each(source, function(item) {
		$("select[name=orgs_list]").append('<option value='+item.value+'>'+item.label+' ('+item.value+')'+'</option>');
	});
	
	$("input[name=filter_org]").autocomplete({
	    source: source,
	    select: function(event, ui) { 
//console.log(ui);	
			$("#selected_orgs").append('<li><a href="#" title="'+ui.item.label+' - Click to remove" class="itemdelete"><span>'+ui.item.value+'</span></a></li>');    	
			$(this).val("");
	    	return false;
	    }
	});
	
	//pge code
	$('input[name="filter_pge"]').focus(function(event) {
		//set selection
		$('input[name="filter_pge_type"]').filter("[value=some]").attr("checked","checked");
	});
	$('input[name="filter_pge_type"]').click(function(event) {
		if ($(this).val()=='all') $('input[name="filter_pge"]').val('');
	});

	//trap removals of selected orgs
	$(".itemdelete").live('click',function(event) {
		$(this).parent().remove();
		return false;
	});
	
	//trap orgs_list trigger
	$("#orgs_list_trigger").click(function(event) {
		$('select[name=orgs_list]').toggle();
	});
	
	//trap selections from org list
	$('select[name=orgs_list]').change(function(event) {
		if ($(this).val()) {
			var val = $(this).val();
			var item = _.find(source, function(item){ return item.value==val; });
//console.log(item);			
			$("#selected_orgs").append('<li><a href="#" title="'+item.label+' - Click to remove" class="itemdelete"><span>'+item.value+'</span></a></li>');
		}		
	});
	
	//trap selections from application_year filter on data table
	$('select[name=data_filter_application_year]').live('change',function(event) {
		var oTable = $('#patents_table').dataTable();     
	    /* Filter immediately */
    	oTable.fnFilter($(this).val(),5);
	});

	//trap submit form click
	$('a#queryform_submit').click(function(event) {
		if (!$(this).hasClass('disabled')) {
			$('a#queryform_submit').addClass("disabled");
			$('#patents_table').empty();
			$('#patents').hide();
			//show loader
			$('#patents_loader').show();
			loadPatents();
		}

		return false;		
	});

	/** patents datatable **/
	$('#patents_table > tbody > tr:not(.details)').live('click', function (event) {   
		var oTable = $('#patents_table').dataTable();
	    var aData = oTable.fnGetData(this); // get datarow
//console.log(fnGetSelected(oTable));

		//if the show details link was clicked trap that		
	   if(event.target.nodeName == "A"){
			if ($(event.target).hasClass('patent_details')) {		
				var pi_node = this;
				if (pi_node != null) {
					var pData = oTable.fnGetData(pi_node);
					if ( $(event.target).html().match('Hide') )
					{
						$(event.target).html('Show');
						//set the class
						$(event.target).removeClass('hide-details');
						$(event.target).addClass('show-details');
						$("#pid_" + pData[1]).slideUp(function() {
							oTable.fnClose(pi_node);
						});
					}
					else
					{
						$(event.target).html('Hide');
						//set the class
						$(event.target).removeClass('show-details');
						$(event.target).addClass('hide-details');
						var tr_details = oTable.fnOpen(pi_node, "<div class='dataInnerts'><div id='pid_" + pData[1] + "'></div><div class='patent-citations'><span id='patent_cited_by_"+pData[1]+"'></span></div></div>", 'details' );
						$(tr_details).addClass('details');
						$("#pid_" + pData[1]).hide();
						//show abstract
						$('#pid_'+pData[1]).html(pData[2]);
						//if citations
						if (pData[8].length>0) {
							//extract the proposal ids
							var propids = pData[8];
							var citations = [];
							_.each(propids, function(propid) {
								citations.push("<a href='http://patft.uspto.gov/netacgi/nph-Parser?Sect1=PTO2&Sect2=HITOFF&p=1&u=%2Fnetahtml%2FPTO%2Fsearch-bool.html&r=1&f=G&l=50&co1=AND&d=PTXT&s1="+propid+".PN.&OS=PN/"+propid+"&RS=PN/"+propid+"' target='_blank'>"+propid+'</a>');
							});
							$('#patent_cited_by_'+pData[1]).html('Cited by: '+citations.join(', '));
						} else {
							$('#patent_cited_by_'+pData[1]).hide();
						}						
						$("#pid_" + pData[1]).slideDown();
					}
				}
				event.preventDefault();
			    return;
			} else {
				return;
			}
		}

	    //var aData = oTable.fnGetData(this); // get datarow
	    if (null != aData)  // null if we clicked on title row
	    {
			//set the class
			if ( $(this).hasClass('row_selected') ) {
				$(this).removeClass('row_selected');
				$(this).removeClass('DTTT_selected');
			} else {
				$(this).addClass('row_selected');
				$(this).addClass('DTTT_selected');
			}
	    }
	});
}

function loadPatents() {
	//make query params
	var queryparams = '';
	//years
	queryparams = 'year='+$('select[name=filter_year] option:selected').val();		
	//orgs
//return false;	
	var selected_orgs = $('#selected_orgs li').map(function(i,n) {
	    return $(n).find('a').text();
	}).get();
	//pge codes
	if ($("input[name=filter_pge_type]:checked").val()!='all' && $('input[name=filter_pge]').val()) selected_orgs.push($('input[name=filter_pge]').val());
//console.log(selected_orgs);	
	if (selected_orgs.length==0) { 
		alert('Please select a division or specify some PGE codes'); 
		//$('#data_loader').hide(); 
		$('#patents_loader').hide();
		$('a#queryform_submit').removeClass("disabled");
		return; 
	}
	queryparams += '&org='+selected_orgs.join(',');
	queryparams += '&status=award';
	//load data
	$.getJSON(apiurl+'topic?' + queryparams + '&page=patent' + '&jsoncallback=?', function(data) {
		var aaData = _.map(data["data"], function(v) { 
			return [
				v["title"],
				v["patent"],
				keyExists("abstract", v, null),
				v["grant_year"], 
				v["assignee"],
				v["application_year"], 
				v["classes"],
				v["inventors"],
				keyExists("cited_by", v, []),
			]; 
		});

//console.log(aaData);

		var oTable = $('#patents_table').dataTable({
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
			"bAutoWidth": false,
			"bProcessing": true,
			"iDisplayLength": 50,
			"aoColumnDefs": [
				{
					"sTitle": "Title",
					"aTargets": [ 0 ]
				},
				{
					"fnRender": function (oObj) {
						return "<a href='http://patft.uspto.gov/netacgi/nph-Parser?Sect1=PTO2&Sect2=HITOFF&p=1&u=%2Fnetahtml%2FPTO%2Fsearch-bool.html&r=1&f=G&l=50&co1=AND&d=PTXT&s1="+oObj.aData[1]+".PN.&OS=PN/"+oObj.aData[1]+"&RS=PN/"+oObj.aData[1]+"' target='_blank'>"+oObj.aData[1]+'</a>';
					},
					"bUseRendered": false,
					"sTitle": "Patent",
					"aTargets": [ 1 ]
				},
				{
					"sTitle": "Abstract",
					"bVisible": false,
					"aTargets": [ 2 ]
				},
				{
					"sTitle": "Grant Year",
					"aTargets": [ 3 ]
				},
				{
					"sTitle": "Assignee",
					"aTargets": [ 4 ]
				},
				{
					"sTitle": "Application Year",
					"aTargets": [ 5 ]
				},
				{
					"fnRender": function ( oObj ) {
						var collated = _.map(oObj.aData[6], function(item) { if (legend_classes[item]) return legend_classes[item]+' ('+item+')'; else return item; });
						return collated.join(', ');
					},
					"sTitle": "Classes",
					"aTargets": [ 6 ]
				},
				{
					"fnRender": function ( oObj ) {
						var collated = _.map(oObj.aData[7], function(row) { var tmp = row["name"]; if (row["nsf_id"]) tmp += ' (' + row["nsf_id"] + ')'; return tmp; });
						return collated.join(', ');
					},
					"sTitle": "Inventors",
					"aTargets": [ 7 ]
				},
				{
					"bVisible": false,
					"aTargets" : [8]
				},
				{
					"fnRender": function ( oObj ) {
						return '<a id="patent_details_'+oObj.aData[1]+'" class="patent_details show-details">Show</a>';
					},
					"bSearchable": false,
					"bSortable": false,
					"aTargets": [ 9 ]
				}
			],
			"aaData": aaData,
			"aaSorting": [[0, 'desc']],
			"oLanguage": {
				"sLengthMenu:": "Display _MENU_ records per page",
				"sSearch": "Keyword Filter:"
			}
		});

		//add a form element to the table header
		$('<div id="data_filter_application_year_container">By Application Year: <select name="data_filter_application_year"><option value="">Select One</option></select></div>').insertAfter('#patents_table_length');
		
		//group by application year
		var grouped = _.groupBy(data["data"],'application_year');
//console.log(grouped);
		//compute totals
		var collated = [];
		for (var key in grouped) {
			collated.push(_.reduce(grouped[key], function(memo, row) {
				return {"year":key,"count":memo["count"]+1};
			},{"year":key,"count":0}));
		}
		//sort by year
		_.sortBy(collated,function(row) { return row["year"];});
		
		//populate the select drop down
		_.each(collated, function(item) {
			$("select[name=data_filter_application_year]").append('<option value='+item.year+'>'+item.year+ ' ('+item.count+')</option>');
		});

		//hide loader
//		$('#data_loader').hide();	
		//show
//		$('#main').show();	
		
		$('#patents_loader').hide();
		$('#patents').show();
		$('a#queryform_submit').removeClass("disabled");
	});		
}