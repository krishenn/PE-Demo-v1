//globals
var fiscalyear = '2011';

//global variable that holds selected proposal data
//when user first selects a proposal, researcher or org read the data and store it in this array (indexed by proposal id)
//then use it to add/remove from the summary instead of retrieving it each time
var propsummarydata = {};

function init() {
//alert(proposalaccessallowed);
	//on page load
	$($('#topics_tabs_template').tmpl()).appendTo('#topics_tabs_container');
	$($('#topics_summary_template').tmpl()).appendTo('#topics_summary_container');

	//set options
	if (!proposalaccessallowed) {		
		//hide first option
		$('#filter_status li:first').hide();		
		//remove filter status for decline and propose
		$('#filter_status li').not(':first').remove();
		//remove declined tab
		//$('#data_tabs').tabs();
		//$('#data_tabs').tabs('remove',0);
	} else {
		$('#filter_status li:first label').text('Awarded and Declined proposals');
	}
	//hide
	$('#queryform_summary_collapsed').hide();
	$('#topics_summary_collapsed').hide();
	$('#topics').hide();
	$('#data_container').hide();
	$('#divisions_tabs').tabs();
	$('#topics_tabs').tabs();
	$('a[id^=queryform_submit_]').addClass("disabled");
	$('a[id^=topics_submit]').addClass('disabled');
	$('#filter_year').hide();

	//load topic legend
	$.getJSON(apiurl+'topic?legend=topic'+'&jsoncallback=?', function(data) {
		_.each(data, function(item) {
			legend_topics[item["topic"]] = {"words":item["words"],"label":item["label"]};
		});
		loadDivisions();
	});			

	//check year filter
	$('select[name="filter_year_from"]').focus(function() {
	    prev_val = $(this).val();
	}).change(function(event) {
		$(this).blur() // Firefox fix
		if ($(this).val()>$('select[name=filter_year_to] option:selected').val()) {
			alert('Year From - select a year prior to '+$('select[name=filter_year_to] option:selected').val());
			$(this).val(prev_val); //set back
			return false;
		}
	});
	$('select[name="filter_year_to"]').focus(function() {
	    prev_val = $(this).val();
	}).change(function(event) {
		$(this).blur() // Firefox fix
		if ($(this).val()<$('select[name=filter_year_from] option:selected').val()) {
			alert('Year To - select a year after '+$('select[name=filter_year_from] option:selected').val());
			$(this).val(prev_val); //set back
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

	/* completed or pending event */
	$('input[name="filter_status"]').click(function() {
		if ($(this).val()=='completed') {
			$('#filter_year').hide();
			$('select[name="filter_year_from"]').val('2007');
			$('select[name="filter_year_to"]').val('2010');
			$('#filter_year_options').show();
			//$('select[name="filter_year_from"]').show();
			//$('select[name="filter_year_to"]').show();
		} else {
			$('#fiscalyear').html(fiscalyear);
			$('#filter_year').show();
			//$('select[name="filter_year_from"]').hide();
			//$('select[name="filter_year_to"]').hide();			
			$('#filter_year_options').hide();
			$('select[name="filter_year_from"]').val(fiscalyear);
			$('select[name="filter_year_to"]').val(fiscalyear);			
		}
	});

	/* queryform submit - load divisions
		load divisions
		show divisions
	*/
	$('a#queryform_submit_divisions').click(function() {
		if (!$(this).hasClass('disabled')) {
			//$('#divisions_table').html('');
			var oTable = $('#divisions_table').dataTable();
			oTable.fnClearTable();
			$('#divisions_loader').show();
			$('a[id^=queryform_submit_]').addClass("disabled");			
			loadDivisions();
		}

		return false;
	});

	/* queryform submit - load topics
		hide queryform
		set querysummary
		show querysummary
		load topics
		show topics
	*/
	$('a#queryform_submit_topics').click(function() {
		if (!$(this).hasClass('disabled')) {		
			var oTable = $('#divisions_table').dataTable();		
			//check to make sure one or more divisions are selected
			var selectedRows = fnGetSelected(oTable);
//console.log(selectedRows);		
			var selected_orgs = _.pluck(selectedRows, 0);
//console.log(selected_orgs);		
			
			$('#queryform').hide();		
			//enable change selection button		
			$('a#queryform_summary_change').removeClass('disabled');		
			//set query summary
			//orgs
			$('#queryform_summary_orgs_count_selected').html(selectedRows.length);
			$('#queryform_summary_orgs_count').html(oTable.fnGetData().length);
			$('#queryform_summary_orgs_selected').html(selected_orgs.join(', '));
			//status
			if (proposalaccessallowed) $('#queryform_summary_filter_status').html('Filter: '+$('input[name=filter_status]:checked').parent().text());
			//years
			$('#queryform_summary_filter_year_from').html($('select[name=filter_year_from] option:selected').text());
			$('#queryform_summary_filter_year_to').html($('select[name=filter_year_to] option:selected').text());
			//pge codes
			if ($("input[name=filter_pge_type]:checked").val()=='all') $('#queryform_summary_filter_pge').html('All');
			else $('#queryform_summary_filter_pge').html($('input[name=filter_pge]').val());	
			//topicconfidence
			$('#queryform_summary_filter_topicconfidence').html($('select[name=filter_topicconfidence] option:selected').text());		
			
			$('#queryform_summary_expanded').hide();
			$('#queryform_summary_collapsed').show();
			//collapse
			$('#divisions_container').removeClass('expanded');
			$('#divisions_container').addClass('collapsed');
			//expand
			$('#topics_container').removeClass('collapsed');
			$('#topics_container').addClass('expanded');
	
			//show hide appropriate summaries and data tabs based on status selector
			//what are the currently selected filter statuses
			var filter_status = $('input[name=filter_status]:checked').val();

			//if award is checked, show award summary in topics, show award tab
			$('#topics_summary_decline').hide();
			$('#topics_summary_award').hide();
			$('#topics_summary_propose').hide();
			//hide tabs
			$('#data_tabs li:first').hide();
			$('#data_tabs li:eq(1)').hide();
			$('#data_tabs li:eq(2)').hide();
			//if decline or other is checked, show decline tab
			if (filter_status=='completed') {
				$('#data_tabs li:eq(2)').show();
				$('#topics_summary_award').show();		
				if (proposalaccessallowed) {
					$('#data_tabs li:eq(1)').show();
					$('#topics_summary_decline').show();					
				}
			}
			else if (proposalaccessallowed) {
					$('#data_tabs li:first').show();
					$('#topics_summary_propose').show();		
			}

			//reset summaries
			$('#topics_summary_collapsed').hide();
			//reset topics
			resetTopics();
			//load topics
			var queryparams = makeAPIQueryParamString();
			var oTable = $('#divisions_table').dataTable();		
			//check to make sure one or more divisions are selected
			var selectedRows = fnGetSelected(oTable);
		//console.log(selectedRows);		
			var selected_orgs = _.pluck(selectedRows, 0);
		//console.log(selected_orgs);
			//pge codes
			if ($("input[name=filter_pge_type]:checked").val()!='all' && $('input[name=filter_pge]').val()) selected_orgs.push($('input[name=filter_pge]').val().replace(/ /gi, ""));
			if (selected_orgs.length>0) queryparams += '&org='+selected_orgs.join(',');
			queryparams += '&summ=status,t1';			
			$('#topics').show();
			loadTopics(queryparams,false);			
		}
		
		return false;
	});
	
	/** querysummary **/
	/* change selection click
		hide querysummary
		hide topics
		hide topicsummary
		hide data
		show queryform
	*/
	$('a#queryform_summary_change').click(function() {
		if (!$(this).hasClass('disabled')) {		
			$('#topics').hide();
			$('#data_container').hide();
			$('#queryform').show();
			//set classes
			$('#divisions_container').removeClass('collapsed');
			$('#divisions_container').addClass('expanded');
			$('#topics_container').removeClass('expanded');
			$('#topics_container').addClass('collapsed');
			$('#results_container').removeClass('expanded');
			$('#results_container').addClass('collapsed');		
			
			//disable this until view topics is selected again
			$(this).addClass('disabled');
		}
				
		return false;
	});

	/** divisions datatable events **/
	/* multiselect checkbox click captured by generic function, triggered by multiselect class on checkbox */
	/* division select checkbox
		mark datatable row as selected/unselected
	*/
	$('input[name="division[]"]').live('click',function() {
		if ($(this).attr('checked')) {
			setRowSelected($(this).parent().parent());
		}
		else {
			//set the class
			setRowUnSelected($(this).parent().parent());
		}
	});
	/* division detail link
		show:
			read from preloaded data
			show division detail
		hide:
			hide division detail
	*/
	$('a[id^=division_details_]').live('click',function() {
		var division = $(this).attr('id').split('_').pop();
		var table = $('#divisions_table').dataTable();
		var row = this.parentNode.parentNode; //we need the node, not the jQuery object
		var link = $(this);
		if ($(this).html()=='Show') {
			//now show it
			var queryparams = makeAPIQueryParamString();
			queryparams += '&org='+division+'&summ=t1,status,pge';
		//console.log(apiurl+'topic?'+queryparams+'&jsoncallback=?');	
			link.html('Hide');
			table.fnOpen(row, "<span id='division_details_loader_"+division+"' class='loader'>Loading...</span><div class='dataInnerts' id='division_details_container_" + division + "'><table><tr><td class='division_details_1'>Most Common <strong>Topics</strong> (by # of Awards)</td><td class='division_details_2' id='groupedby_t1_"+division+"'></td><td class='division_details_3'>Most Common <strong>PGE Codes</strong> (by # of Awards)</td><td class='division_details_4' id='groupedby_pge_"+division+"'></td></tr></table></div>", 'details' );
			$("#division_details_container_" + division).hide();
			$.getJSON(apiurl+'topic?'+queryparams+'&jsoncallback=?', function(data) {			
				//group by t1
				var grouped = _.groupBy(data["data"],function(row) { return row["t1"]; });
			//console.log(grouped);		
				//now assemble
				var collated = [];
				for (var t1 in grouped) {
					if (t1=='undefined') var topicid='0';
					else var topicid = t1;
					collated.push(_.reduce(grouped[t1],function(memo,row) {
						if (!legend_topics[topicid]["label"]) var label = 'Not Electronically Readable';
						else var label = legend_topics[topicid]["label"];
						return {"t1":memo["t1"],"label":label,"count":memo["count"] + row["count"]};
					},{"t1":topicid,"label":null,"count":0}));
				}
			//console.log(collated);		
				//sort by awards, ascending
				//only take the first x
				var sorted = _.sortBy(collated,function(row) { return row["count"]; });
			//console.log(sorted);		
				var data_t1 = _.last(sorted,10).reverse();
			//console.log('top');		
			//console.log(data_t1);		

				//group by pge
				var grouped = _.groupBy(data["data"],function(row) { return row["pge"]; });
				//now assemble
				var collated = [];
				for (var pge in grouped) {
					collated.push(_.reduce(grouped[pge],function(memo,row) {
						return {"pge":memo["pge"],"label":null,"count":memo["count"] + row["count"]};
					},{"pge":pge,"label":null,"count":0}));
				}
				//sort by awards
				//only take the last x
				var sorted = _.sortBy(collated,function(row) { return row["count"]; });
				var data_pge = _.last(sorted,10).reverse();
			//console.log(data_t1);			
			//console.log(data_pge);		

				var data = {};
				data["t1"] = data_t1;
				data["pge"] = data_pge;

			//console.log(data);	
				_.each(data["t1"], function(item){
					$($("#division_details_groupedby_t1_template").tmpl(item)).appendTo("#groupedby_t1_" + division);
				});
				//before displaying, get the label for the pge codes
				var pge_codes = _.pluck(data_pge,"pge");
				if (pge_codes.length) {
					var legend_pges = {};
					$.getJSON(apiurl+'proposal?legend=nsf_pge&q='+pge_codes.join(',')+'&jsoncallback=?', function(pgedata) {
						_.each(pgedata, function(item) {							
							legend_pges[item["nsf_pge"]] = {"label":item["label"],"full_label":item["full_label"]};
						});
						_.each(data["pge"], function(item){
							if (legend_pges[item["pge"]]) item["label"] = legend_pges[item["pge"]]["label"];
							$($("#division_details_groupedby_pge_template").tmpl(item)).appendTo("#groupedby_pge_" + division);
						});					
					});			
				}
				$("#division_details_loader_" + division).hide();
				$("#division_details_container_" + division).slideDown();
			});
			//set the class
			$(this).removeClass('show-details');
			$(this).addClass('hide-details');
		} else {
			link.html('Show');
			$("#division_details_container_" + division).slideUp(function() {
				table.fnClose(row);
			});
			//set the class
			$(this).removeClass('hide-details');
			$(this).addClass('show-details');			
		}
	});

	/** topics **/
	/** topics datatable events **/
	/* multiselect checkbox click captured by generic function, triggered by multiselect class on checkbox */
	/* topic select checkbox
		mark datatable row as selected/unselected
		show/hide showresults buttons
		update selection summary
	*/
	$('input[name="topic[]"]').live('click',function() {
		var topicid = $(this).val();
	
		//update row selections
		if ($(this).attr('checked')) {
			setRowSelected($(this).parent().parent());
		} else {
			//set the class
			setRowUnSelected($(this).parent().parent());
		}
		
		//filter rawdata by selected divisions and selected topics
		var oTable = $('#divisions_table').dataTable();		
		var selectedRows = fnGetSelected(oTable);
//console.log(selectedRows);
		var selected_orgs = _.pluck(selectedRows, 0);
//console.log(selected_orgs);		
		var oTable = $('#topics_table').dataTable();
		var selectedRows = fnGetSelected(oTable);
		//get selected topics
		var selected_topics = _.pluck(selectedRows, 0);

		//reset
		resetTopicSummary();
		$('#topics_summary_institutions_count').html('');
		$('#topics_summary_researchers_count').html('');

		//show loading state
		$('#topics_summary_award_pge_loader').show();
		$('#topics_summary_award_org_loader').show();
		$('#topics_summary_award_year_loader').show();
		$('#topics_summary_decline_pge_loader').show();
		$('#topics_summary_decline_org_loader').show();
		$('#topics_summary_decline_year_loader').show();
		$('#topics_summary_propose_pge_loader').show();
		$('#topics_summary_propose_org_loader').show();
		$('#topics_summary_propose_year_loader').show();
		
		//update summary
		updateTopicSummary(selectedRows);

		//get additional summary data for div, pge, year, institutions, researchers
		if (selectedRows.length>0) {
			if ($(this).attr('checked')) {
				//for summary data that needs to be downloaded
				//make query params
				var queryparams = '';
				//years
				queryparams = 'year='+$('select[name=filter_year_from] option:selected').val()+'-'+$('select[name=filter_year_to] option:selected').val();		
				//orgs
				var oTable = $('#divisions_table').dataTable();		
				var selectedRows = fnGetSelected(oTable);
		//console.log(selectedRows);
				var selected_orgs = _.pluck(selectedRows, 0);
				//pge codes
				if ($("input[name=filter_pge_type]:checked").val()!='all' && $('input[name=filter_pge]').val()) selected_orgs.push($('input[name=filter_pge]').val().replace(/ /gi, ""));
				if (selected_orgs.length>0) queryparams += '&org='+selected_orgs.join(',');
		//console.log(selected_orgs);		
				//status
				var tmp = '';
				if ($('input[name=filter_status]:checked').val()=='completed') {
					tmp = 'award';
					if (proposalaccessallowed) tmp += ',decline';
			    } else if (proposalaccessallowed) {
					tmp += 'propose';
				}
				queryparams += '&status='+tmp;			

				//if summary data items not previously retrieved
					//retrieve them
						//store them
						//run the updater
				//else run the updater
				//pge
				if (_.any(topicsummarydata_pge, function(row) { return topicid==row["t1"]; })) {
					updateTopicSummaryData(topicsummarydata_pge, selected_topics,'pge');
				} else {
					var params = queryparams+'&'+$('select[name=filter_topicconfidence] option:selected').val()+'='+topicid+"&summ=pge,status";
					$.getJSON(apiurl + 'topic?' + params + '&jsoncallback=?', function(data) {
						//summarize the data before storing
						//group by pge
						var grouped = _.groupBy(data["data"],function(row) { return row["pge"]; });
					//console.log('grouped');		
					//console.log(grouped);		
						//now assemble and store in global variable
						for (var pge in grouped) {
							topicsummarydata_pge.push(summarizeTopicBy(topicid,pge,grouped[pge]));
						}
						updateTopicSummaryData(topicsummarydata_pge, selected_topics,'pge');						
					});
				}

				//org
				if (_.any(topicsummarydata_org, function(row) { return topicid==row["t1"]; })) {
					updateTopicSummaryData(topicsummarydata_org, selected_topics,'org');
				} else {
					var params = queryparams+'&'+$('select[name=filter_topicconfidence] option:selected').val()+'='+topicid+"&summ=org,status";
					$.getJSON(apiurl + 'topic?' + params + '&jsoncallback=?', function(data) {
						//summarize the data before storing
						//group by pge
						var grouped = _.groupBy(data["data"],function(row) { return row["org"]; });
					//console.log('grouped');		
					//console.log(grouped);		
						//now assemble and store in global variable
						for (var org in grouped) {
							topicsummarydata_org.push(summarizeTopicBy(topicid,org,grouped[org]));
						}
						updateTopicSummaryData(topicsummarydata_org, selected_topics,'org');
					});
				}

				//year
				if (_.any(topicsummarydata_year, function(row) { return topicid==row["t1"]; })) {
					updateTopicSummaryData(topicsummarydata_year, selected_topics,'year');
				} else {
					var params = queryparams+'&'+$('select[name=filter_topicconfidence] option:selected').val()+'='+topicid+"&summ=year,status";
					$.getJSON(apiurl + 'topic?' + params + '&jsoncallback=?', function(data) {
						//summarize the data before storing
						//group by pge
						var grouped = _.groupBy(data["data"],function(row) { return row["year"]; });
					//console.log('grouped');		
					//console.log(grouped);		
						//now assemble and store in global variable
						for (var year in grouped) {
							topicsummarydata_year.push(summarizeTopicBy(topicid,year,grouped[year]));
						}
						updateTopicSummaryData(topicsummarydata_year, selected_topics,'year');
					});
				}
			}
			else {
				//run the updaters
				updateTopicSummaryData(topicsummarydata_pge, selected_topics,'pge');
				updateTopicSummaryData(topicsummarydata_org, selected_topics,'org');
				updateTopicSummaryData(topicsummarydata_year, selected_topics,'year');
			}
			
			//get count of institutions - we're not caching these for now
			var params = queryparams+'&'+$('select[name=filter_topicconfidence] option:selected').val()+'='+selected_topics.join(',')+"&page=org";
			$('#topics_summary_institutions_count').html('Updating...');
			$.getJSON(apiurl + 'topic?' + params + '&count' + '&jsoncallback=?', function(data) {
				$('#topics_summary_institutions_count').html(data["count"]);
				$('#topics_submit_institutions').removeClass('disabled');
			});
	
			//get count of researchers - we're not caching these for now
			var params = queryparams+'&'+$('select[name=filter_topicconfidence] option:selected').val()+'='+selected_topics.join(',')+"&page=pi";
			$('#topics_summary_researchers_count').html('Updating...');
			$.getJSON(apiurl + 'topic?' + params + '&count' + '&jsoncallback=?', function(data) {
				$('#topics_summary_researchers_count').html(data["count"]);
				$('#topics_submit_researchers').removeClass('disabled');
			});		
		}
	});
	/* topic detail link
		show:
			read from preloaded data
			show topic detail
		hide:
			hide topic detail
	*/
	$('a[id^=topic_details_]').live('click',function() {
		if (!$(this).hasClass('disabled')) {		
			showTopicDetails(this);
		}
		
		return false;
	});
	
	$('#topics_selection_clear').click(function(event) {
		clearTopicSelection();
		$('#topics_summary_institutions_count').html('');
		$('#topics_summary_researchers_count').html('');
		event.preventDefault();
	})
	
	/** topicsummary **/
	/* change selection click
		hide topicsummary
		hide data
		show topics
	*/
	$('a#topics_summary_change').click(function() {
		if (!$(this).hasClass('disabled')) {		
			$('#topics').show();
			$('#data_container').hide();
			//set classes
			$('#topics_container').removeClass('collapsed');
			$('#topics_container').addClass('expanded');
			$('#results_container').removeClass('expanded');
			$('#results_container').addClass('collapsed');		
	
			//disable this until view topics is selected again
			$(this).addClass('disabled');
		}
		
		return false;
	});
	
	/** showresults **/
	//engage ui tabs for data tabs
	$('#data_tabs').tabs({
		select: function(event, ui) {
			var url = $(ui.tab).attr('href');
//console.log(url);			
	        if( url ) {
				var tab = url.split('_').pop();
				//show Tab
				showTab(tab);
	        }
	        return true;
		}		
	});
	
	/* showresults buttons click
		one or more topics must be selected
		hide topics
		set topicsummary
		show topicsummary
		load data (based on target tab i.e. proposals, awards, researchers, institutions
		show data
	*/
	$('a[id^=topics_submit]').click(function() {
		if (!$(this).hasClass('disabled')) {		
			var oTable = $('#topics_table').dataTable();		
			//check to make sure one or more divisions are selected
			var selectedRows = fnGetSelected(oTable);
	//console.log(selectedRows);		
			if (selectedRows.length==0) { alert('Please select a topic'); return false; }
	//console.log(selectedRows);
			var selected_topics = _.map(selectedRows, function(item) {
				//return '<span><strong>t'+item[0]+':</strong>'+item[1]+'</span>';
				var tmp = item[1].split(' - ');
				return '<span>'+tmp[0]+'</span>';
			});
	//console.log(selected_orgs);		
		
			$('#topics').hide();
			//enable change selection button		
			$('a#topics_summary_change').removeClass('disabled');		
		
			//set topic summary
			$('#topics_summary_count_selected').html(selectedRows.length);
			$('#topics_summary_count').html(oTable.fnGetData().length);
			$('#topics_summary_selected').html(selected_topics.join(''));		
			$('#topics_summary_expanded').hide();
			$('#topics_summary_collapsed').show();
			//collapse topics
			$('#topics_container').removeClass('expanded');
			$('#topics_container').addClass('collapsed');
			//expand results
			$('#results_container').removeClass('collapsed');
			$('#results_container').addClass('expanded');
		
			//clear out existing data before showing to reset old results
			$('#awards_table').empty();
			$('#declines_table').empty();
			$('#researchers_table').empty();
			$('#institutions_table').empty();
			//clear out existing data summaries as well
			$('#summary_props').html('');
			$('#summary_prop_datefirst').html('');
			$('#summary_prop_datelast').html('');
			$('#summary_prop_funding_total').html('');
			$('#summary_prop_funding_min').html('');		
			$('td[id^=summary_rankedprops_]').html('');
			$('#summary_grants').html('');
			$('#summary_datefirst').html('');
			$('#summary_datelast').html('');
			$('#summary_funding_total').html('');
			$('#summary_funding_min').html('');		
			$('td[id^=summary_rankedgrants_]').html('');
			$('#summary_pis').html('');
			$('td[id^=summary_rankedpis_]').html('');
			$('#summary_orgs').html('');
			$('td[id^=summary_rankedorgs_]').html('');
		
			//deselect all tabs
		    $('#data_tabs').tabs( 'selected' , -1 );
		    $(".ui-tabs-selected").removeClass("ui-state-active").removeClass("ui-tabs-selected");
		
			//determine tab to show (in id of link, separate by _ and use last slice)
			var tab = $(this).attr('id').split('_').pop();
			//show appropriate tab
			//find the index
			var index = $('#data_tabs a[href="#'+'data_tabs_'+tab+'"]').parent().index();
	//console.log(index);	
			$('#data_tabs').tabs('select', index);
		
			$('#data_container').show();		
		}
		return false;
	});
	
	/** proposed datatable **/
	$('#proposed_table tbody tr').live('click', function (event) {
		var oTable = $('#proposed_table').dataTable();
	    var aData = oTable.fnGetData(this); // get datarow

		//if the prop id link was clicked trap that		
	   if(event.target.nodeName == "A") {
//console.log($(event.target));		
			return;
		}

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
			updateProposeSummary(oTable,aData,$(this).hasClass('row_selected'));
	    }
	});

	/** declines datatable **/
	$('#declines_table tbody tr').live('click', function (event) {
		var oTable = $('#declines_table').dataTable();
	    var aData = oTable.fnGetData(this); // get datarow

		//if the prop id link was clicked trap that		
	   if(event.target.nodeName == "A") {
//console.log($(event.target));		
			return;
		}

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
			updateDeclineSummary(oTable,aData,$(this).hasClass('row_selected'));
	    }
	});

	/** awards datatable **/
	$('#awards_table > tbody > tr:not(.details)').live('click', function (event) {
		var oTable = $('#awards_table').dataTable();

		//if the show details link was clicked trap that		
	   if(event.target.nodeName == "A"){
			if ($(event.target).hasClass('award_details')) {		
				var nTr = this;
				if (nTr != null) {
					var aData = oTable.fnGetData(nTr);
					if ( $(event.target).html().match('Hide') )
					{
						$(event.target).html('Show');
						//set the class
						$(event.target).removeClass('hide-details');
						$(event.target).addClass('show-details');
						$("#pid_" + aData[0]).slideUp(function() {
							oTable.fnClose(nTr);
						});
					}
					else
					{
						$(event.target).html('Hide');
						//set the class
						$(event.target).removeClass('show-details');
						$(event.target).addClass('hide-details');
						var tr_details = oTable.fnOpen(nTr, "<span id='pid_loader_"+aData[0]+"' class='loader'>Loading...</span><div class='dataInnerts' id='pid_" + aData[0] + "'><div id='prop_details_" + aData[0] + "'></div><h3>Researchers:</h3><table class='dataInnerts'><thead><tr><th>ID</th><th>Name</th><th>Institution</th><th>Department</th></thead><tbody id='pi_details_" + aData[0] + "'></tbody></table></div>", 'details' );
						$(tr_details).addClass('details');
						$.getJSON(apiurl+'prop?id=' + aData[0] + '&jsoncallback=?', function(data) {
							$("#pid_" + aData[0]).hide();
							$("#prop_details_" + aData[0]).html($("#prop_details_template").tmpl(data["data"]));
							$("#pid_loader_" + aData[0]).hide();
							$("#pid_" + aData[0]).slideDown();
						});
						$.getJSON(apiurl+'prop?id=' + aData[0] + '&page=pi' + '&jsoncallback=?', function(data) {
							_.each(data["data"],function(row) {
								if (!row["inst"]) row["inst"] = {"name":"","dept":""};
								$($("#prop_pi_details_template").tmpl(row)).appendTo("#pi_details_" + aData[0]);
							});
						});
					}
				}
				event.preventDefault();
				return;
			} else {
				return;
			}
	   }

	    var aData = oTable.fnGetData(this); // get datarow
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
			updateAwardSummary(oTable,aData,$(this).hasClass('row_selected'));
	    }
	});
	
	//pge code lookup event
	$('span[id^=pgecode_lookup_]').live('mouseover',function(event) {
		var link = this;
		if ($(this).attr('title')=='') {
			//not previously retrieved
			//get the pge code
			var pgecode = $(link).attr('id').split('_').pop();
			if (pgecode) {
				$(this).attr('title','Retrieving...');
				$.getJSON(apiurl+'proposal?legend=nsf_pge&q='+pgecode+'&jsoncallback=?', function(data) {
					if (data.length>0 && data[0]["nsf_pge"]) $(link).attr('title',data[0]["label"]);
				});			
			}
		}
	});
	
	/** researchers datatable **/
	$('#researchers_table > tbody > tr:not(.details)').live('click', function (event) {   
		showResearcherDetails(this, event);
	});

	/** institutions datatable **/
	$('#institutions_table > tbody > tr:not(.details)').live('click', function (event) {        
		var oTable = $('#institutions_table').dataTable();

		//if the show details link was clicked trap that		
	   if(event.target.nodeName == "A"){
			if ($(event.target).hasClass('institution_details')) {		
				var org_node = this;
				if (org_node != null) {
					var orgData = oTable.fnGetData(org_node);
					if ( $(event.target).html().match('Hide') )
					{
						$(event.target).html('Show');
						//set the class
						$(event.target).removeClass('hide-details');
						$(event.target).addClass('show-details');
						$("#org_" + orgData[0]).slideUp(function() {
							oTable.fnClose(org_node);
						});
					}
					else
					{
						$(event.target).html('Hide');
						//set the class
						$(event.target).removeClass('show-details');
						$(event.target).addClass('hide-details');						
						var tr_details = oTable.fnOpen(org_node, "<div class='dataInnerts overflow' id='org_" + orgData[0] + "'><span id='org_loader_"+orgData[0]+"' class='loader'>Loading...</span><table><tr><td class='pi_details_user' id='org_details_"+orgData[0]+"'></td><td class='pi_details_prop'><span id='org_summary_loader_"+orgData[0]+"' class='loader'>Loading...</span><span id='org_proposal_summary_"+orgData[0]+"'></span></td></tr></table><table class='pi_details_proplist' id='org_propList_"+orgData[0]+"'></table></div>", 'details' );
						$(tr_details).addClass('details');
						$("#org_" + orgData[0]).hide();
						//get org details
						//load org data
						$.getJSON(apiurl+'org?id=' + orgData[0] + '&jsoncallback=?', function(data) {
							$($("#orgRender").tmpl(data["data"])).appendTo("#org_details_" + orgData[0]);
						});						
						//get list of all proposals for institution
						//extract the proposal ids
						var propids = orgData[4];
//console.log(propids);							
						//now load the proposals
						if (propids.length>0) {
							$.getJSON(apiurl + 'proposal?id=' + propids.join(',') + '&jsoncallback=?', function(data) {
								//for each prop store the data in the cache if it is part of the currently filtered set
								if (data["data"]) {
									for (var i in data["data"]) {							
			//console.log(data["data"][i]["nsf_id"]);
										propsummarydata[data["data"][i]["nsf_id"]] = data["data"][i];
									}
								}
								var propids_awarded = [];
								var propids_declined = [];
								var propids_proposed = [];
								$.each(data["data"], function(i, item){
									if (item["status"]["name"]=="award") propids_awarded.push(item["nsf_id"]);
									else if (item["status"]["name"]=="decline") propids_declined.push(item["nsf_id"]);
									else if (item["status"]["name"]=="propose") propids_proposed.push(item["nsf_id"]);
								});								
								//render the list
								renderPropList('org', orgData[0], data, propids, propids_awarded, propids_declined, propids_proposed, null);
							});
						}
						$("#org_loader_" + orgData[0]).hide();
						$("#org_" + orgData[0]).slideDown();
					}
				}
				event.preventDefault();
			    return;
			} else {
				return;
			}
		}

	    var aData = oTable.fnGetData(this); // get datarow
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
			updateInstitutionSummary(aData,$(this).hasClass('row_selected'));
	    }
	});
	 
}

/** DIVISIONS **/
/*loadDivisions */
/*
triggered on page load
divisions data retrieved from the data source

Returns: JSON data
*/
function loadDivisions() {
	var queryparams = makeAPIQueryParamString();
	queryparams += '&summ=org,status';
	//pge codes
	if ($("input[name=filter_pge_type]:checked").val()!='all' && $('input[name=filter_pge]').val()) queryparams += '&org='+$('input[name=filter_pge]').val().replace(/ /gi, "");
//console.log(apiurl+'topic?'+queryparams+'&jsoncallback=?');	
	$.getJSON(apiurl+'topic?'+queryparams+'&jsoncallback=?', function(data) {
		initDivisions(data["data"]);
		//hide loader
		$('#data_loader').hide();
		//show main content container
		$('#main').show();
		//divisions
		$('#divisions_loader').hide();
		$('#divisions_tabs').show();
		$('a[id^=queryform_submit_]').removeClass("disabled");
	});
}

/* initDivisions */
/*
divisions data loaded into datatable

Param: data (JSON data)

Returns: nothing
*/
function initDivisions(rawdata) {
	//prepare data
	//group by org
	var grouped = _.groupBy(rawdata,function(row) { return row["org"]; });
	//now assemble
	var summary = {};
	for (var org in grouped) {
		summary[org] = _.reduce(grouped[org],function(memo,row) {
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
			return {"count_awarded":memo["count_awarded"]+count_awarded,"count_declined":memo["count_declined"]+count_declined,"count_other":memo["count_other"]+count_other,"funding_awarded":memo["funding_awarded"]+funding_awarded,"funding_requested":memo["funding_requested"]+funding_requested};
		},{"count_awarded":0,"count_declined":0,"count_other":0,"funding_awarded":0,"funding_requested":0});
	}
	var collated = [];
	//now using the master list
	for (var org in divisions) {
		if (summary[org]) {
			var tmp = summary[org];
			tmp["org"] = org;
			tmp["title"] = divisions[org];
			tmp["directorate"] = directorates[org]==undefined?'Other':directorates[org];
			collated.push(tmp);
		}
	}
//console.log(collated);	
	//sort by title
	//collated = _.sortBy(collated,function(row) { return row["title"]; });
	//prepare for datatable data - conv to array
	var aaData = _.map(collated, function(row) {
		return [row["org"], row["title"], row["directorate"], row["count_awarded"],row["funding_awarded"],row["count_declined"],row["count_other"],row["funding_requested"]];
	});
//console.log(collated);			
//console.log(tmp);		
	
//console.log(aaData);
	var oTable = $('#divisions_table').dataTable({
		//TableTools - copy, csv, print, pdf
		"bJQueryUI": true,
		"sPaginationType": "full_numbers",
		"bDestroy": true,
		"bProcessing": true,
		"bAutoWidth": false,
		"iDisplayLength": 50,
		"aaData": aaData,
		"fnDrawCallback": function ( oSettings ) {
			if ( oSettings.aiDisplay.length == 0 )
			{
				return;
			}			
			var nTrs = $('#divisions_table tbody tr');
			var iColspan = nTrs[0].getElementsByTagName('td').length;
			var sLastGroup = "";
			for ( var i=0 ; i<nTrs.length ; i++ )
			{
				var iDisplayIndex = oSettings._iDisplayStart + i;
				var sGroup = oSettings.aoData[ oSettings.aiDisplay[iDisplayIndex] ]._aData[2];
				if ( sGroup != sLastGroup )
				{
					var nGroup = document.createElement( 'tr' );
					var nCell = document.createElement( 'td' );
					nCell.colSpan = iColspan;
					nCell.className = "group";
					nCell.innerHTML = sGroup;
					nGroup.appendChild( nCell );
					nTrs[i].parentNode.insertBefore( nGroup, nTrs[i] );
					sLastGroup = sGroup;
				}
			}
		},
		"aoColumnDefs": [
			{
				"fnRender": function ( oObj ) {
					return '<input type="checkbox" name="division[]" value="'+oObj.aData[0]+'">';
				},
				"sClass": "center",
				"bSearchable": false,
				"bSortable": false,
				"bUseRendered": false,
				"sTitle": "Select",
				"aTargets": [ 0 ]
			},
			{
				"fnRender": function ( oObj ) {
					return oObj.aData[1]+' ('+oObj.aData[0]+')';
				},
				"sTitle": "Divisions",
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
				"sTitle": "Declined",
				"bVisible": false,
				"aTargets": [ 5 ]
			},
			{
				"sTitle": "Other",
				"bVisible": false,
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
				"fnRender": function ( oObj ) {
					return '<a id="division_details_'+oObj.aData[0]+'" class="show-details">Show</a>';
				},
				"bSearchable": false,
				"bSortable": false,
				"aTargets": [ 8 ]
			}
		],
		//"aaSortingFixed": [[ 2, 'asc' ]]
		//"aaSorting": [[ 1, 'asc' ]]
		"bSort": false
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
}

/** DATA **/
/*showTab */
/*
show tab

Param: tab (string)

Returns: JSON data
*/
function showTab(tab) {
	//hide all summaries
	$('div[id^=data_summary_]').hide();
	//show the appropriate one
	$('div[id^=data_summary_'+tab+']').show();	
	
	//read the appropriate tab
	//is data already loaded in tab - show tab
	var numRows = $('#'+tab+'_table tr').length;
//console.log(tab+' numRows:'+numRows);	
	if (numRows==0) {
		//load data
		//make query params
		var queryparams = '';
		//years
		queryparams = 'year='+$('select[name=filter_year_from] option:selected').val()+'-'+$('select[name=filter_year_to] option:selected').val();		
		//orgs
		var oTable = $('#divisions_table').dataTable();		
		var selectedRows = fnGetSelected(oTable);
//console.log(selectedRows);
		var selected_orgs = _.pluck(selectedRows, 0);
		//pge codes
		if ($("input[name=filter_pge_type]:checked").val()!='all' && $('input[name=filter_pge]').val()) selected_orgs.push($('input[name=filter_pge]').val().replace(/ /gi, ""));
		if (selected_orgs.length>0) queryparams += '&org='+selected_orgs.join(',');
//console.log(selected_orgs);		
		var oTable = $('#topics_table').dataTable();
		var selectedRows = fnGetSelected(oTable);
		//get selected topics
		var selected_topics = _.pluck(selectedRows, 0);
		//topicconfidence
		//topic operators OR or AND
		var topic_operator = ','; //$('select[name=filter_topic_operator] option:selected').val();
		//if ($('select[name=filter_topicconfidence] option:selected').val()=='primary') queryparams += '&t1='+selected_topics.join(topic_operator);
		//else queryparams += '&t='+selected_topics.join(topic_operator);
		queryparams += '&'+$('select[name=filter_topicconfidence] option:selected').val()+'='+selected_topics.join(topic_operator);
		//load data
		//do some checking here for tab
		if (tab=="awards" || tab=="declines" || tab=="proposed") {
			var page = "grant";
			if (tab=="awards") queryparams += '&status=award';
			else if (tab=="declines") queryparams += '&status=decline';
			else if (tab=="proposed") queryparams += '&status=propose';
		} else if (tab=="researchers" || tab=="institutions"){
			if (tab=="researchers") var page = 'pi';
			else if (tab=="institutions") var page = 'org';
			var tmp = '';
			if ($('input[name=filter_status]:checked').val()=='completed') {
				tmp = 'award';
				if (proposalaccessallowed) tmp += ',decline';
		    } else if (proposalaccessallowed) {
				tmp += 'propose';
			}
			queryparams += '&status='+tmp;
		}
		$('#'+tab+'_loader').show();
		$.getJSON(apiurl+'topic?' + queryparams + '&page=' + page + '&jsoncallback=?', function(data) {
			initData(tab, data["data"]);		
		});		
	}
}

/* initData */
/*
tab data loaded into datatable

Param: tab (string), data (array)

Returns: JSON data
*/
function initData(tab,data) {
	if (tab == "proposed") {
		var aaData = _.map(data, function(v) { 
			return [
				v["proposal"]["nsf_id"],
				keyExists("request.dollar", v, null),
				keyExists("request.date", v, null),
				v["pge"]["code"], 
				v["org"]["name"],
				v["topic"]["id"].join(", ").replace(', ,', ""), 
				//v["status"]["name"],
			]; 
		});

		var oTable = $('#proposed_table').dataTable({
			//TableTools - copy, csv, print, pdf
			"bJQueryUI": true,
			"sPaginationType": "full_numbers",
			//"sDom": 'T<"clear">lfrtip',
			//"sDom": 'T<"clear"><"H"lfr>t<"F"ip>',
			"bDestroy": true,
			"bAutoWidth": false,
			"bProcessing": true,
			"iDisplayLength": 50,
			"aoColumnDefs": [
				{
					"sTitle": "Prop ID",
					"aTargets": [ 0 ]
				},
				{ 
					"fnRender": function ( oObj ) {
						return addCommas(oObj.aData[1]);
					},
					"bUseRendered": false,
					"sTitle": "Requested Amount",
					"aTargets": [ 1 ]
				},
				{ 
					"sTitle": "Request Date",
					"aTargets": [ 2 ] 
				}, 
				{ 
					"fnRender": function (oObj ) {
						return '<span id="pgecode_lookup_'+oObj.aData[3]+'">p'+oObj.aData[3]+'</span>';
					},
					"sTitle": "Prg. Elem. Code", 
					"aTargets": [ 3 ] 
				}, 
				{ "sTitle": "Division", "aTargets": [ 4 ] }, 
				{ 
					"fnRender": function ( oObj ) {
						var topics = oObj.aData[5].split(', ');
						var collated = _.map(topics, function(item) { if (legend_topics[item]) return 't'+item+':'+legend_topics[item]["label"]; else return 't'+item; });
						return collated.join(', ');
					},
					"sTitle": "Topics", 
					"aTargets": [ 5 ] 
				}
			],
			"aaData": aaData,
			"aaSorting": [[2, 'desc'], [0, 'desc']],
			"oLanguage": {
				"sLengthMenu:": "Display _MENU_ records per page",
				"sSearch": "Keyword Filter:"
			}
		});
	} else if (tab == "declines") {
		var aaData = _.map(data, function(v) { 
			return [
				v["proposal"]["nsf_id"],
				keyExists("request.dollar", v, null),
				keyExists("request.date", v, null),
				v["pge"]["code"], 
				v["org"]["name"],
				v["topic"]["id"].join(", ").replace(', ,', ""), 
				//v["status"]["name"],
			]; 
		});

		var oTable = $('#declines_table').dataTable({
			//TableTools - copy, csv, print, pdf
			"bJQueryUI": true,
			"sPaginationType": "full_numbers",
			//"sDom": 'T<"clear">lfrtip',
			//"sDom": 'T<"clear"><"H"lfr>t<"F"ip>',
			"bDestroy": true,
			"bAutoWidth": false,
			"bProcessing": true,
			"iDisplayLength": 50,
			"aoColumnDefs": [
				{
					"sTitle": "Prop ID",
					"aTargets": [ 0 ]
				},
				{ 
					"fnRender": function ( oObj ) {
						return addCommas(oObj.aData[1]);
					},
					"bUseRendered": false,
					"sTitle": "Requested Amount",
					"aTargets": [ 1 ]
				},
				{ 
					"sTitle": "Request Date",
					"aTargets": [ 2 ] 
				}, 
				{ 
					"fnRender": function (oObj ) {
						return '<span id="pgecode_lookup_'+oObj.aData[3]+'">p'+oObj.aData[3]+'</span>';
					},
					"sTitle": "Prg. Elem. Code", 
					"aTargets": [ 3 ] 
				}, 
				{ "sTitle": "Division", "aTargets": [ 4 ] }, 
				{ 
					"fnRender": function ( oObj ) {
						var topics = oObj.aData[5].split(', ');
						var collated = _.map(topics, function(item) { if (legend_topics[item]) return 't'+item+':'+legend_topics[item]["label"]; else return 't'+item; });
						return collated.join(', ');
					},					
					"sTitle": "Topics", 
					"aTargets": [ 5 ] 
				}
			],
			"aaData": aaData,
			"aaSorting": [[2, 'desc'], [0, 'desc']],
			"oLanguage": {
				"sLengthMenu:": "Display _MENU_ records per page",
				"sSearch": "Keyword Filter:"
			}
		});
	} else if (tab == "awards") {
		var aaData = _.map(data, function(v) { 
			return [
				v["proposal"]["nsf_id"],
				keyExists("awarded.dollar", v, null),
				keyExists("awarded.date", v, null),
				keyExists("request.date", v, null),
				v["pge"]["code"], 
				v["org"]["name"],
				v["topic"]["id"].join(", ").replace(', ,', ""), 
				v["proposal"]["title"],
			]; 
		});
//console.log(aaData);

		var oTable = $('#awards_table').dataTable({
			//TableTools - copy, csv, print, pdf
			"bJQueryUI": true,
			"sPaginationType": "full_numbers",
			//"sDom": 'T<"clear">lfrtip',
			//"sDom": 'T<"clear"><"H"lfr>t<"F"ip>',
			"bAutoWidth": false,
			"bDestroy": true,
			"bProcessing": true,
			"iDisplayLength": 50,
			"aoColumnDefs": [
				{
					"sTitle": "Prop ID",
					"aTargets": [ 0 ]
				},
				{ 
					"fnRender": function ( oObj ) {
						return addCommas(oObj.aData[1]);
					},
					"bUseRendered": false,
					"sTitle": "Awarded Amount",
					"aTargets": [ 1 ]
				},
				{ 
					"sTitle": "Award Date",
					"aTargets": [ 2 ] 
				}, 
				{ 
					"sTitle": "Request Date",
					"bVisible": false,
					"aTargets": [ 3 ] 
				}, 
				{ 
					"fnRender": function (oObj ) {
						return '<span id="pgecode_lookup_'+oObj.aData[4]+'">p'+oObj.aData[4]+'</span>';
					},
					"sTitle": "Prg. Elem. Code", 
					"aTargets": [ 4 ] 
				}, 
				{ "sTitle": "Division", "aTargets": [ 5 ] }, 
				{ 
					"fnRender": function ( oObj ) {
						var topics = oObj.aData[6].split(', ');
						var collated = _.map(topics, function(item) { if (legend_topics[item]) return 't'+item+':'+legend_topics[item]["label"]; else return 't'+item; });
						return collated.join(', ');
					},
					"sTitle": "Topics",
					"aTargets": [ 6 ]
				},
				{ 
					"fnRender": function ( oObj ) {
						return '<a class="award_details show-details" title="'+oObj.aData[7]+'">Show</a>';
					},
					"bSortable": false,						
					"sTitle": "Details",
					"aTargets": [ 7 ]
				}
			],
			"aaData": aaData,
			"aaSorting": [[1, 'desc']], //, [0, 'desc']
			"oLanguage": {
				"sLengthMenu:": "Display _MENU_ records per page",
				"sSearch": "Keyword Filter:"
			}
		});
	} else if (tab == "researchers") {			
		initResearchers(data);
	}  else if (tab == "institutions") {			
		var aaData = _.map(data, function(v) { 
			return [
				keyExists("nsf_id", v, "Not Available"), 
				keyExists("name", v, "Not Available"),
				v["count"],
				keyExists("pi", v, []),
				v["prop"],
				'Show',
			]; 
		});


		var oTable = $('#institutions_table').dataTable({
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
					"sTitle": "Institution ID",
					"aTargets": [ 0 ]
				},
				{ 
					"sTitle": "Name", 
					"aTargets": [ 1 ] 
				}, 
				{ 
					"sTitle": "Number of Proposals", 
					"aTargets": [ 2 ] 
				}, 
				{ 
					"fnRender": function ( oObj ) {
						return oObj.aData[3].length;
					},
					"bVisible": false,
					"sTitle": "# of PIs", 
					"aTargets": [ 3 ]
				},
				{ 
					"fnRender": function ( oObj ) {
						//wrap each prop id in a link
						var formatted = [];
						if (oObj.aData[4]) {
							for (var i in oObj.aData[4]) {
								var link = 'http://www.nsf.gov/awardsearch/showAward.do?AwardNumber='+oObj.aData[4][i];
								var title = 'Open in nsf.gov';
								if (proposalaccessallowed) {
									link = 'https://www.ejacket.nsf.gov/ej/showProposal.do?optimize=Y&ID='+oObj.aData[4][i]+'&docid='+oObj.aData[4][i];
									title = 'Open in e-Jacket';
								}
								formatted.push('<a href="'+link+'" title="'+title+'" target="_blank">'+oObj.aData[4][i]+'</a>');
							}

						}
						return formatted.join(',');
					},
					"bUseRendered": false,
					"bVisible": false, 
					"sTitle": "Grant IDs", 
					"aTargets": [ 4 ] 
				},
				{ 
					"fnRender": function ( oObj ) {
						return '<a class="institution_details show-details" title="'+oObj.aData[5]+'">Show</a>';
					},
					"bSearchable": false,
					"bSortable": false,						
					"sTitle": "Details",
					"aTargets": [ 5 ]
				}					
			],
			"aaData": aaData,
			"aaSorting": [[2, 'desc']]
		});
		
		//hide inst id if public
		if (!proposalaccessallowed) {
			oTable.fnSetColumnVis( 0, false );
		}
	}

	//custom export button
	//export using the same query params as we used to load the table
	//make query params
	var queryparams = '';
	//years
	queryparams = 'year='+$('select[name=filter_year_from] option:selected').val()+'-'+$('select[name=filter_year_to] option:selected').val();		
	//orgs
	var oTable = $('#divisions_table').dataTable();		
	var selectedRows = fnGetSelected(oTable);
//console.log(selectedRows);
	var selected_orgs = _.pluck(selectedRows, 0);
	//pge codes
	if ($("input[name=filter_pge_type]:checked").val()!='all' && $('input[name=filter_pge]').val()) selected_orgs.push($('input[name=filter_pge]').val().replace(/ /gi, ""));
	if (selected_orgs.length>0) queryparams += '&org='+selected_orgs.join(',');
//console.log(selected_orgs);		
	var oTable = $('#topics_table').dataTable();
	var selectedRows = fnGetSelected(oTable);
	//get selected topics
	var selected_topics = _.pluck(selectedRows, 0);
	//topicconfidence
	//topic operators OR or AND
	var topic_operator = ','; //$('select[name=filter_topic_operator] option:selected').val();
	//if ($('select[name=filter_topicconfidence] option:selected').val()=='primary') queryparams += '&t1='+selected_topics.join(topic_operator);
	//else queryparams += '&t='+selected_topics.join(topic_operator);
	queryparams += '&'+$('select[name=filter_topicconfidence] option:selected').val()+'='+selected_topics.join(topic_operator);
	//load data
	//do some checking here for tab
	if (tab=="awards" || tab=="declines" || tab=="proposed") {
		var page = "grant";
		if (tab=="awards") queryparams += '&status=award';
		else if (tab=="declines") queryparams += '&status=decline';
		else if (tab=="proposed") queryparams += '&status=propose';
	} else if (tab=="researchers" || tab=="institutions"){
		if (tab=="researchers") var page = 'pi';
		else if (tab=="institutions") var page = 'org';
		var tmp = '';
		if ($('input[name=filter_status]:checked').val()=='completed') {
			tmp = 'award';
			if (proposalaccessallowed) tmp += ',decline';
	    } else if (proposalaccessallowed) {
			tmp += 'propose';
		}
		queryparams += '&status='+tmp;
	}
	var exporturl = apiurl+'topic?'+queryparams+'&page='+page+'&format=csv';
	$('<div class="export"><a href="'+exporturl+'">Export as CSV</a></div>').insertAfter('#'+tab+'_table_filter');
			
	$('#'+tab+'_loader').hide();
}

/** propose data tab handling functions **/
/* update summary */
function updateProposeSummary(oTable,aData,selected) {
	//now aData[0] - 1st column(count_id), aData[1] -2nd, etc. 
	//trap prop selection
	var numGrantsSelected = $("#summary_proposed").html();
	var numFundingSelected = parseInt(removeNumberFormatting($("#summary_proposed_funding_total").html()));
	if (isNaN(numFundingSelected)) numFundingSelected = 0;
//	var dateFirst = $("#summary_prop_datefirst").html();
//	var dateLast = $("#summary_prop_datelast").html();
//	if (dateLast) dateLast = new Date(dateLast);
	if (selected) {
		numGrantsSelected++; 
		numFundingSelected += parseInt(aData[1]);
	} else {
		numGrantsSelected--;
		numFundingSelected -= parseInt(aData[1]);
	}

	//now reformat
	numFundingSelected = addCommas(numFundingSelected);
	if (numFundingSelected) numFundingSelected = '$'+numFundingSelected;

	$("#summary_propopsed").html(numGrantsSelected);
	$("#summary_proposed_funding_total").html(numFundingSelected);

//console.log(fnGetSelected(oTable));
	//now recalculate the rankings - do this regardless of checked or unchecked
	var checkedprops = fnGetSelected(oTable);
	//now for the prop rankings
	//first by amount of award
	//sort the summaries list - descending by funding
	checkedprops.sort(function(a,b) {return (parseInt(a[1]) > parseInt(b[1])) ? -1 : ((parseInt(b[1]) > parseInt(a[1])) ? 1 : 0);} );	
	//now select the top 4 out of the summaries list
	for (var i=0;i<4;i++) {
		//we always reset this - just for now, for simplicity sake, later we can add a check to see if the rankings need to be updated or not
		$("#summary_rankedproposed_byfunding_"+(i+1)).html(null);	
		if (checkedprops[i]) {
			var tmp = addCommas(checkedprops[i][1]);
			if (tmp) tmp = '$'+tmp;				
			//we found one, add it to the summary
			$("#summary_rankedproposed_byfunding_"+(i+1)).html(tmp+' ('+checkedprops[i][0]+')');				
		}
	}
	//min summary
	$("#summary_proposed_funding_min").html(null);	
	if (checkedprops.length) {
		var tmp = addCommas(checkedprops[checkedprops.length-1][1]);
		if (tmp) tmp = '$'+tmp;				
		$("#summary_proposed_funding_min").html(tmp+' ('+checkedprops[checkedprops.length-1][0]+')');					
	}
	//date summary
	//sort the summaries list - ascending by date
	checkedprops.sort(function(a,b) {return (a[2] > b[2]) ? 1 : ((b[2] > a[2]) ? -1 : 0);} );	
	var dateFirst = null;
	var dateLast = null;
	if (checkedprops.length>0) {
		dateFirst = checkedprops[0][2];
		/*if (dateFirst) {
			var tmpdate = new Date(dateFirst);
			dateFirst = tmpdate.getFullYear()+'/'+tmpdate.getMonth()+'/'+tmpdate.getDate();
		}*/
		dateLast = checkedprops[checkedprops.length-1][2];
		/*if (dateLast) {
			var tmpdate = new Date(dateLast);
			dateLast = tmpdate.getFullYear()+'/'+tmpdate.getMonth()+'/'+tmpdate.getDate();
		}*/
	}
	$("#summary_proposed_datefirst").html(dateFirst);
	$("#summary_proposed_datelast").html(dateLast);	
}

/** declines data tab handling functions **/
/* update summary */
function updateDeclineSummary(oTable,aData,selected) {
	//now aData[0] - 1st column(count_id), aData[1] -2nd, etc. 
	//trap prop selection
	var numGrantsSelected = $("#summary_props").html();
	var numFundingSelected = parseInt(removeNumberFormatting($("#summary_prop_funding_total").html()));
	if (isNaN(numFundingSelected)) numFundingSelected = 0;
//	var dateFirst = $("#summary_prop_datefirst").html();
//	var dateLast = $("#summary_prop_datelast").html();
//	if (dateLast) dateLast = new Date(dateLast);
	if (selected) {
		numGrantsSelected++; 
		numFundingSelected += parseInt(aData[1]);
	} else {
		numGrantsSelected--;
		numFundingSelected -= parseInt(aData[1]);
	}

	//now reformat
	numFundingSelected = addCommas(numFundingSelected);
	if (numFundingSelected) numFundingSelected = '$'+numFundingSelected;

	$("#summary_props").html(numGrantsSelected);
	$("#summary_prop_funding_total").html(numFundingSelected);

//console.log(fnGetSelected(oTable));
	//now recalculate the rankings - do this regardless of checked or unchecked
	var checkedprops = fnGetSelected(oTable);
	//now for the prop rankings
	//first by amount of award
	//sort the summaries list - descending by funding
	checkedprops.sort(function(a,b) {return (parseInt(a[1]) > parseInt(b[1])) ? -1 : ((parseInt(b[1]) > parseInt(a[1])) ? 1 : 0);} );	
	//now select the top 4 out of the summaries list
	for (var i=0;i<4;i++) {
		//we always reset this - just for now, for simplicity sake, later we can add a check to see if the rankings need to be updated or not
		$("#summary_rankedprops_byfunding_"+(i+1)).html(null);	
		if (checkedprops[i]) {
			var tmp = addCommas(checkedprops[i][1]);
			if (tmp) tmp = '$'+tmp;				
			//we found one, add it to the summary
			$("#summary_rankedprops_byfunding_"+(i+1)).html(tmp+' ('+checkedprops[i][0]+')');				
		}
	}
	//min summary
	$("#summary_prop_funding_min").html(null);	
	if (checkedprops.length) {
		var tmp = addCommas(checkedprops[checkedprops.length-1][1]);
		if (tmp) tmp = '$'+tmp;				
		$("#summary_prop_funding_min").html(tmp+' ('+checkedprops[checkedprops.length-1][0]+')');					
	}
	//date summary
	//sort the summaries list - ascending by date
	checkedprops.sort(function(a,b) {return (a[2] > b[2]) ? 1 : ((b[2] > a[2]) ? -1 : 0);} );	
	var dateFirst = null;
	var dateLast = null;
	if (checkedprops.length>0) {
		dateFirst = checkedprops[0][2];
		/*if (dateFirst) {
			var tmpdate = new Date(dateFirst);
			dateFirst = tmpdate.getFullYear()+'/'+tmpdate.getMonth()+'/'+tmpdate.getDate();
		}*/
		dateLast = checkedprops[checkedprops.length-1][2];
		/*if (dateLast) {
			var tmpdate = new Date(dateLast);
			dateLast = tmpdate.getFullYear()+'/'+tmpdate.getMonth()+'/'+tmpdate.getDate();
		}*/
	}
	$("#summary_prop_datefirst").html(dateFirst);
	$("#summary_prop_datelast").html(dateLast);	
}

/** awards data tab handling functions **/
/* update summary */
function updateAwardSummary(oTable,aData,selected) {
    //now aData[0] - 1st column(count_id), aData[1] -2nd, etc. 
	//trap grant selection
	var numGrantsSelected = $("#summary_grants").html();
	var numFundingSelected = parseInt(removeNumberFormatting($("#summary_funding_total").html()));
	if (isNaN(numFundingSelected)) numFundingSelected = 0;
	//var dateFirst = $("#summary_datefirst").html();
	//var dateLast = $("#summary_datelast").html();
	//if (dateLast) dateLast = new Date(dateLast);
	if (selected) {
		numGrantsSelected++; 
		if (!isNaN(parseInt(aData[1]))) numFundingSelected += parseInt(aData[1]);
	} else {
		numGrantsSelected--;
		if (!isNaN(parseInt(aData[1]))) numFundingSelected -= parseInt(aData[1]);
	}

	//now reformat
	numFundingSelected = addCommas(numFundingSelected);
	if (numFundingSelected) numFundingSelected = '$'+numFundingSelected;

	$("#summary_grants").html(numGrantsSelected);
	$("#summary_funding_total").html(numFundingSelected);

//console.log(fnGetSelected(oTable));
	//now recalculate the rankings - do this regardless of checked or unchecked
	var checkedgrants = fnGetSelected(oTable);
	//now for the grant rankings
	//first by amount of award
	//sort the summaries list - descending by funding
	checkedgrants.sort(function(a,b) {return (parseInt(a[1]) > parseInt(b[1])) ? -1 : ((parseInt(b[1]) > parseInt(a[1])) ? 1 : 0);} );	
//console.log(checkedgrants);			
	//now select the top 4 out of the summaries list
	for (var i=0;i<4;i++) {
		//we always reset this - just for now, for simplicity sake, later we can add a check to see if the rankings need to be updated or not
		$("#summary_rankedgrants_byfunding_"+(i+1)).html(null);	
		if (checkedgrants[i]) {
			var tmp = addCommas(checkedgrants[i][1]);
			if (tmp) tmp = '$'+tmp;				
			//we found one, add it to the summary
			$("#summary_rankedgrants_byfunding_"+(i+1)).html(tmp+' ('+checkedgrants[i][0]+')');				
		}
	}
	//min summary
	$("#summary_funding_min").html(null);	
	if (checkedgrants.length) {
		var tmp = addCommas(checkedgrants[checkedgrants.length-1][1]);
		if (tmp) tmp = '$'+tmp;				
		$("#summary_funding_min").html(tmp+' ('+checkedgrants[checkedgrants.length-1][0]+')');					
	}
	//date summary
	//sort the summaries list - ascending by date
	checkedgrants.sort(function(a,b) {return (a[2] > b[2]) ? 1 : ((b[2] > a[2]) ? -1 : 0);} );	
//console.log(checkedgrants);	
	var dateFirst = null;
	var dateLast = null;
	if (checkedgrants.length>0) {
		dateFirst = checkedgrants[0][2];
/*		if (dateFirst) {
			var tmpdate = new Date(dateFirst);
			dateFirst = tmpdate.getFullYear()+'/'+tmpdate.getMonth()+'/'+tmpdate.getDate();
		}*/
		dateLast = checkedgrants[checkedgrants.length-1][2];
/*		if (dateLast) {
			var tmp = new Date(dateLast);
			dateLast = tmpdate.getFullYear()+'/'+tmpdate.getMonth()+'/'+tmpdate.getDate();
		}*/
	}
	$("#summary_datefirst").html(dateFirst);
	$("#summary_datelast").html(dateLast);	
}

/** institutions data tab handling functions **/
function updateInstitutionSummary(aData,selected) {
//now aData[0] - 1st column(count_id), aData[1] -2nd, etc. 
	//trap grant selection
	var numOrgsSelected = $("#summary_orgs").html();
	if (selected) {
		numOrgsSelected++; 
	} else {
		numOrgsSelected--;
	}

	$("#summary_orgs").html(numOrgsSelected);

//console.log(fnGetSelected(oTable));
	//load prop data for selected pis so we can calculate summaries and rankings
	//var rowdata = oTable.fnGetData(this);
	var propids = aData[4];
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
			summarizeOrg();
		});
	} else {
		summarizeOrg();
	}	
}

function summarizeOrg() {
//console.log(propsummarydata);
	//now recalculate the rankings - do this regardless of checked or unchecked
	//current checked items
	var oTable = $("#institutions_table").dataTable();
	var checkedorgs =  _.map(fnGetSelected(oTable),function(v) {
//console.log(v);
		var tmp = {};
		tmp['propcount'] = v[2];

		//now total up the funding for all the proposals
		var awardcount = 0;
		var requestfunding = 0;
		var awardfunding = 0;

		var propids = v[4];
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
	checkedorgs.sort(function(a,b) {return (parseInt(a.propcount) > parseInt(b.propcount)) ? -1 : ((parseInt(b.propcount) > parseInt(a.propcount)) ? 1 : 0);} );	
	//now select the top 5 out of the summaries list
	for (var i=0;i<5;i++) {
		//we always reset this - just for now, for simplicity sake, later we can add a check to see if the rankings need to be updated or not
		$("#summary_rankedorgs_bypropcount_"+(i+1)).html(null);	
		if (checkedorgs[i]) {
			//we found one, add it to the summary
			$("#summary_rankedorgs_bypropcount_"+(i+1)).html(checkedorgs[i]['propcount']+' ('+checkedorgs[i]['name']+')');				
		}
	}
	//by number of awards
	//sort the summaries list - descending by number of awarded proposals
	checkedorgs.sort(function(a,b) {return (parseInt(a.awardcount) > parseInt(b.awardcount)) ? -1 : ((parseInt(b.awardcount) > parseInt(a.awardcount)) ? 1 : 0);} );	
//console.log(checkedorgs);		
	//now select the top 5 out of the summaries list
	for (var i=0;i<5;i++) {
		//we always reset this - just for now, for simplicity sake, later we can add a check to see if the rankings need to be updated or not
		$("#summary_rankedorgs_byawardcount_"+(i+1)).html(null);	
		if (checkedorgs[i] && checkedorgs[i]['awardcount']) {
			//we found one, add it to the summary
			$("#summary_rankedorgs_byawardcount_"+(i+1)).html(checkedorgs[i]['awardcount']+' ('+checkedorgs[i]['name']+')');				
		}
	}
	//by number of award funding
	//sort the summaries list - descending by funding of awarded proposals
	checkedorgs.sort(function(a,b) {return (parseInt(a.awardfunding) > parseInt(b.awardfunding)) ? -1 : ((parseInt(b.awardfunding) > parseInt(a.awardfunding)) ? 1 : 0);} );	
//console.log(checkedorgs);		
	//now select the top 5 out of the summaries list
	for (var i=0;i<5;i++) {
		//we always reset this - just for now, for simplicity sake, later we can add a check to see if the rankings need to be updated or not
		$("#summary_rankedorgs_byawardfunding_"+(i+1)).html(null);	
		if (checkedorgs[i] && checkedorgs[i]['awardfunding']) {
			//we found one, add it to the summary
			$("#summary_rankedorgs_byawardfunding_"+(i+1)).html('$'+addCommas(checkedorgs[i]['awardfunding'])+' ('+checkedorgs[i]['name']+')');				
		}
	}
	//by avg. award funding by grant
	//sort the summaries list - descending by funding of awarded proposals
	checkedorgs.sort(function(a,b) {return (parseFloat(a.avgawardfunding) > parseFloat(b.avgawardfunding)) ? -1 : ((parseFloat(b.avgawardfunding) > parseFloat(a.avgawardfunding)) ? 1 : 0);} );	
//console.log(checkedorgs);		
	//now select the top 5 out of the summaries list
	for (var i=0;i<5;i++) {
		//we always reset this - just for now, for simplicity sake, later we can add a check to see if the rankings need to be updated or not
		$("#summary_rankedorgs_byavgawardfunding_"+(i+1)).html(null);	
		if (checkedorgs[i] && checkedorgs[i]['avgawardfunding']) {
			//we found one, add it to the summary
			$("#summary_rankedorgs_byavgawardfunding_"+(i+1)).html('$'+addCommas(checkedorgs[i]['avgawardfunding'])+' ('+checkedorgs[i]['name']+')');				
		}
	}
}

/* General use functions */
function makeAPIQueryParamString() {
	//using query form, extract all the selected options into a dictionary
	var queryparams = [];
	//status
	var tmp = '';
	if ($('input[name=filter_status]:checked').val()=='completed') {
		tmp = 'award';
		if (proposalaccessallowed) tmp += ',decline';
    } else if (proposalaccessallowed) {
		tmp += 'propose';
	}
	queryparams.push('status='+tmp);
	//years
	queryparams.push('year='+$('select[name=filter_year_from] option:selected').val()+'-'+$('select[name=filter_year_to] option:selected').val());

//console.log(queryparams);
	
	return queryparams.join('&');
}