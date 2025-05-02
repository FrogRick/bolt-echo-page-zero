
const PricingFooter = () => {
  return (
    <div className="mt-12 text-center text-gray-500">
      <p>All prices in USD. Cancel anytime.</p>
      <p className="mt-2">
        Need a custom plan for larger organizations?{" "}
        <a 
          href="mailto:contact@firemap.com" 
          className="text-primary hover:underline"
        >
          Contact us
        </a>
      </p>
    </div>
  );
};

export default PricingFooter;
